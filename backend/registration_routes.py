"""API routes per la gestione delle iscrizioni espanse con PDF"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
import os
import logging
from models import RegistrationCreate, Registration
from pdf_service import PDFService
from email_service import EmailService
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["registrations"])

# Database
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logger = logging.getLogger(__name__)

# Admin authentication
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")

def require_admin(authorization: Optional[str] = Header(default=None)):
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=500, detail="Admin token non configurato")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token mancante")
    token = authorization.split(" ", 1)[1].strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token non valido")
    return True


# ========== REGISTRATION ENDPOINTS ==========

@router.post("/registrations/create")
async def create_registration(payload: RegistrationCreate):
    """
    Crea una nuova registrazione di iscrizione.
    - Salva i dati nel DB
    - Compila il PDF con i dati forniti
    - Memorizza il PDF in base64
    """
    try:
        # 1. Valida i dati
        registration_data = payload.model_dump()
        
        # 2. Genera il PDF compilato
        pdf_base64 = PDFService.generate_pdf_from_registration(registration_data)
        
        # 3. Crea l'oggetto Registration
        registration = Registration(
            **registration_data,
            pdf_base64=pdf_base64,
            status="pending"
        )
        
        # 4. Salva nel database
        doc = registration.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        result = await db.registrations.insert_one(doc)
        
        logger.info(f"Registrazione creata: {registration.id}")
        
        return {
            "registration_id": registration.id,
            "status": "pending",
            "message": "Iscrizione salvata. Procedi al pagamento."
        }
        
    except Exception as e:
        logger.error(f"Errore nella creazione della registrazione: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/registrations/{registration_id}/payment-completed")
async def mark_payment_completed(registration_id: str):
    """
    Marca una registrazione come pagata.
    Invia l'email di conferma all'utente.
    """
    try:
        registration = await db.registrations.find_one(
            {"id": registration_id},
            {"_id": 0}
        )
        
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
        
        # 1. Aggiorna lo stato
        await db.registrations.update_one(
            {"id": registration_id},
            {"$set": {
                "status": "completed",
                "payment_completed": True,
                "payment_completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # 2. Invia email di conferma
        email_service = EmailService()
        await email_service.send_registration_confirmation(
            email=registration.get("email"),
            first_name=registration.get("first_name"),
            registration_id=registration_id
        )
        
        logger.info(f"Pagamento confermato per registrazione: {registration_id}")
        
        return {"ok": True, "message": "Pagamento registrato. Email inviata."}
        
    except Exception as e:
        logger.error(f"Errore nel completamento pagamento: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ========== ADMIN ENDPOINTS ==========

@router.get("/admin/registrations")
async def admin_get_registrations(_: bool = Depends(require_admin)):
    """
    Lista tutte le registrazioni (con PDF base64).
    Accesso solo admin.
    """
    try:
        docs = await db.registrations.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).to_list(1000)
        
        # Rimuovi il PDF dal response per risparmiare banda (è troppo grosso)
        for doc in docs:
            doc.pop("pdf_base64", None)
        
        return docs
        
    except Exception as e:
        logger.error(f"Errore nel recupero registrazioni: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/registrations/{registration_id}/pdf")
async def admin_download_pdf(registration_id: str, _: bool = Depends(require_admin)):
    """
    Scarica il PDF compilato di una registrazione.
    Accesso solo admin.
    """
    try:
        registration = await db.registrations.find_one(
            {"id": registration_id},
            {"_id": 0, "pdf_base64": 1, "first_name": 1, "last_name": 1}
        )
        
        if not registration or not registration.get("pdf_base64"):
            raise HTTPException(status_code=404, detail="PDF non trovato")
        
        # Marca come scaricato
        await db.registrations.update_one(
            {"id": registration_id},
            {"$set": {"document_downloaded": True, "document_downloaded_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "pdf_base64": registration["pdf_base64"],
            "filename": f"iscrizione_{registration['first_name']}_{registration['last_name']}_{registration_id[:8]}.pdf"
        }
        
    except Exception as e:
        logger.error(f"Errore nel download PDF: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/registrations/{registration_id}/cleanup")
async def admin_cleanup_registration(registration_id: str, _: bool = Depends(require_admin)):
    """
    Elimina i dati temporanei di una registrazione DOPO il download del PDF.
    Mantiene solo: nome, cognome, telefono, email, origin (referral).
    Accesso solo admin.
    """
    try:
        registration = await db.registrations.find_one({"id": registration_id})
        
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
        
        if not registration.get("document_downloaded"):
            raise HTTPException(
                status_code=400,
                detail="Devi scaricare il documento prima di poter eliminare i dati"
            )
        
        # Mantieni solo i dati essenziali
        cleaned_data = {
            "id": registration["id"],
            "first_name": registration["first_name"],
            "last_name": registration["last_name"],
            "email": registration["email"],
            "phone": registration["phone"],
            "referral": registration.get("referral"),
            "status": "archived",
            "created_at": registration["created_at"],
            "document_downloaded": True,
            "document_deleted_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Aggiorna il documento
        await db.registrations.replace_one(
            {"id": registration_id},
            cleaned_data
        )
        
        logger.info(f"Dati sensibili eliminati per registrazione: {registration_id}")
        
        return {"ok": True, "message": "Dati sensibili eliminati. Conservati solo dati essenziali."}
        
    except Exception as e:
        logger.error(f"Errore nel cleanup: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/registrations/{registration_id}/approve")
async def admin_approve_registration(registration_id: str, _: bool = Depends(require_admin)):
    """
    Approva una registrazione e la promuove a socio.
    Accesso solo admin.
    """
    try:
        registration = await db.registrations.find_one(
            {"id": registration_id},
            {"_id": 0}
        )
        
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
        
        # Promuovi a socio
        from models import Member
        
        member = Member(
            first_name=registration["first_name"],
            last_name=registration["last_name"],
            email=registration["email"].lower(),
            phone=registration.get("phone"),
            notes=f"Iscritto da: {registration.get('referral', 'Non specificato')}"
        )
        
        member_doc = member.model_dump()
        member_doc["joined_at"] = member_doc["joined_at"].isoformat()
        
        # Salva il nuovo socio
        await db.members.insert_one(member_doc)
        
        # Aggiorna la registrazione
        await db.registrations.update_one(
            {"id": registration_id},
            {"$set": {"status": "approved", "promoted_to_member_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Registrazione approvata e promossa a socio: {registration_id}")
        
        return {"ok": True, "message": f"Socio {member.first_name} {member.last_name} creato con successo."}
        
    except Exception as e:
        logger.error(f"Errore nell'approvazione: {e}")
        raise HTTPException(status_code=400, detail=str(e))
