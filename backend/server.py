from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Trama Viva APS")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== IMPORT MODELS ==========
from models import (
    EventSignupCreate, EventSignup, MembershipCreate, Membership,
    ContactCreate, Contact, Event, EventCreate, EventUpdate,
    PaymentRequest, MemberCreate, Member, MemberUpdate,
    RegistrationCreate, Registration
)
from pdf_service import PDFService
from email_service import EmailService


# ========== UTILITY FUNCTIONS ==========
def make_slug(title: str) -> str:
    import re, unicodedata
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s).strip().lower()
    s = re.sub(r"\s+", "-", s)
    return s[:80] or "evento"


# ========== SEEDED EVENTS ==========
EVENTS: List[dict] = [
    {
        "id": "evt-aperi-01",
        "title": "Aperitivo di Benvenuto",
        "category": "Aperitivi Sociali",
        "date": "2026-06-13",
        "time": "19:00",
        "location": "Piazza Centrale, Milano",
        "description": "Un calice in mano e tante chiacchiere nuove. Vieni a conoscere la trama che stiamo tessendo insieme.",
        "emoji": "🍹",
        "spots": 30,
    },
    {
        "id": "evt-walk-01",
        "title": "Passeggiata al Parco Nord",
        "category": "Passeggiate",
        "date": "2026-06-21",
        "time": "10:00",
        "location": "Parco Nord, Ingresso Viale Suzzani",
        "description": "5 km di cammino lento tra alberi e storie. Porta scarpe comode e una domanda per il tuo vicino di filo.",
        "emoji": "🌿",
        "spots": 25,
    },
    {
        "id": "evt-screen-01",
        "title": "Giornata Screening Salute",
        "category": "Screening Salute",
        "date": "2026-07-05",
        "time": "09:30",
        "location": "Centro Civico Zona 9",
        "description": "Controlli gratuiti su pressione, glicemia e benessere generale. Perché prendersi cura di sé è un atto politico.",
        "emoji": "💚",
        "spots": 40,
    },
    {
        "id": "evt-it-01",
        "title": "Corso IT Base — Lezione 1",
        "category": "Corsi IT",
        "date": "2026-07-12",
        "time": "18:00",
        "location": "Sala Studio Trama Viva",
        "description": "Il computer non morde. Iniziamo dal basso: email, documenti, e sopravvivere allo SPID senza piangere.",
        "emoji": "💻",
        "spots": 15,
    },
    {
        "id": "evt-aperi-02",
        "title": "Aperitivo Tematico — Film cult italiani",
        "category": "Aperitivi Sociali",
        "date": "2026-07-25",
        "time": "20:00",
        "location": "Bar Sociale, Via Padova",
        "description": "Spritz e citazioni a ripetizione. Chi dice 'Amici miei' offre il secondo giro.",
        "emoji": "🎬",
        "spots": 35,
    },
    {
        "id": "evt-walk-02",
        "title": "Trekking Urbano — Street Art Edition",
        "category": "Passeggiate",
        "date": "2026-09-19",
        "time": "15:00",
        "location": "Quartiere Isola",
        "description": "Muri che parlano, persone che ascoltano. 3 ore di murales e meraviglia.",
        "emoji": "🎨",
        "spots": 20,
    },
]


# ========== ROUTES: ROOT ==========
@api_router.get("/")
async def root():
    return {"message": "Trama Viva APS API", "tagline": "Ogni filo conta"}


# ========== ROUTES: EVENTS ==========
@api_router.get("/events", response_model=List[Event])
async def get_events():
    docs = await db.events.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    return docs


@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    return doc


@api_router.get("/events/{event_id}/signups-count")
async def get_event_signups_count(event_id: str):
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    count = await db.event_signups.count_documents({"event_id": doc["id"]})
    return {"count": count}


# ========== ROUTES: EVENT SIGNUPS & MEMBERSHIPS ==========
@api_router.post("/event-signup", response_model=EventSignup)
async def create_event_signup(payload: EventSignupCreate):
    obj = EventSignup(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.event_signups.insert_one(doc)
    return obj


@api_router.post("/membership", response_model=Membership)
async def create_membership(payload: MembershipCreate):
    obj = Membership(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.memberships.insert_one(doc)
    return obj


@api_router.post("/contact", response_model=Contact)
async def create_contact(payload: ContactCreate):
    obj = Contact(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    return obj


# ========== ROUTES: REGISTRATIONS (NEW) ==========
@api_router.post("/registrations/create")
async def create_registration(payload: RegistrationCreate):
    try:
        registration_data = payload.model_dump()
        pdf_base64 = PDFService.generate_pdf_from_registration(registration_data)
        
        registration = Registration(
            **registration_data,
            pdf_base64=pdf_base64,
            status="pending"
        )
        
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


@api_router.post("/registrations/{registration_id}/payment-completed")
async def mark_payment_completed(registration_id: str):
    try:
        registration = await db.registrations.find_one(
            {"id": registration_id},
            {"_id": 0}
        )
        
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
        
        await db.registrations.update_one(
            {"id": registration_id},
            {"$set": {
                "status": "completed",
                "payment_completed": True,
                "payment_completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
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


# ========== ROUTES: PAYMENTS ==========
@api_router.post("/payments/create-checkout")
async def create_sumup_checkout(payload: PaymentRequest):
    api_key = os.environ.get("SUMUP_API_KEY")
    merchant_code = os.environ.get("SUMUP_MERCHANT_CODE")
    
    if not api_key:
        logger.error("SUMUP_API_KEY non configurata")
        raise HTTPException(status_code=500, detail="Chiave API SumUp non configurata nel server")
    if not merchant_code:
        logger.error("SUMUP_MERCHANT_CODE non configurata")
        raise HTTPException(status_code=500, detail="Codice Commerciante SumUp non configurato nel server")

    formatted_amount = round(payload.amount, 2)
    checkout_reference = f"tv-{str(uuid.uuid4())[:8]}"

    async with httpx.AsyncClient() as client_http:
        url = "https://api.sumup.com/v0.1/checkouts"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        checkout_data = {
            "merchant_code": merchant_code,
            "amount": formatted_amount,
            "currency": "EUR",
            "checkout_reference": checkout_reference,
            "description": payload.description,
            "redirect_url": "https://www.tramavivaaps.com",
            "hosted_checkout": {
                "enabled": True
            }
        }

        try:
            response = await client_http.post(url, json=checkout_data, headers=headers)
            
            if response.status_code != 201:
                logger.error(f"Errore SumUp API: {response.status_code} - {response.text}")
                raise HTTPException(status_code=400, detail=f"Errore SumUp: {response.text}")
            
            res_json = response.json()
            
            return {
                "id": res_json.get("id"),
                "status": res_json.get("status"),
                "checkout_url": res_json.get("hosted_checkout_url")
            }
            
        except httpx.RequestError as exc:
            logger.error(f"Errore di rete con SumUp: {exc}")
            raise HTTPException(status_code=503, detail="Servizio di pagamento non raggiungibile")


# ========== ADMIN AUTH ==========
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


@api_router.post("/admin/login")
async def admin_login(payload: dict):
    token = (payload or {}).get("token", "")
    if not ADMIN_TOKEN or token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Password non valida")
    return {"ok": True}


# ========== ADMIN: EVENT SIGNUPS & MEMBERSHIPS ==========
@api_router.get("/admin/event-signups", dependencies=[Depends(require_admin)])
async def admin_event_signups():
    docs = await db.event_signups.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    member_emails = await _get_member_emails()
    events = await db.events.find({}, {"_id": 0, "id": 1, "contributo": 1}).to_list(1000)
    events_map = {e["id"]: e for e in events}
    for d in docs:
        d["is_member"] = (d.get("email") or "").lower() in member_emails
        event = events_map.get(d.get("event_id"), {})
        d["contributo"] = event.get("contributo", 0)
    return docs


@api_router.get("/admin/memberships", dependencies=[Depends(require_admin)])
async def admin_memberships():
    docs = await db.memberships.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    member_emails = await _get_member_emails()
    for d in docs:
        d["is_member"] = (d.get("email") or "").lower() in member_emails
    return docs


@api_router.get("/admin/registrations", dependencies=[Depends(require_admin)])
async def admin_get_registrations():
    docs = await db.registrations.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    for doc in docs:
        doc.pop("pdf_base64", None)
    return docs


@api_router.get("/admin/registrations/{registration_id}/pdf", dependencies=[Depends(require_admin)])
async def admin_download_pdf(registration_id: str):
    registration = await db.registrations.find_one(
        {"id": registration_id},
        {"_id": 0, "pdf_base64": 1, "first_name": 1, "last_name": 1}
    )
    
    if not registration or not registration.get("pdf_base64"):
        raise HTTPException(status_code=404, detail="PDF non trovato")
    
    await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"document_downloaded": True, "document_downloaded_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "pdf_base64": registration["pdf_base64"],
        "filename": f"iscrizione_{registration['first_name']}_{registration['last_name']}_{registration_id[:8]}.pdf"
    }


@api_router.post("/admin/registrations/{registration_id}/cleanup", dependencies=[Depends(require_admin)])
async def admin_cleanup_registration(registration_id: str):
    registration = await db.registrations.find_one({"id": registration_id})
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registrazione non trovata")
    
    if not registration.get("document_downloaded"):
        raise HTTPException(
            status_code=400,
            detail="Devi scaricare il documento prima di poter eliminare i dati"
        )
    
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
    
    await db.registrations.replace_one(
        {"id": registration_id},
        cleaned_data
    )
    
    logger.info(f"Dati sensibili eliminati per registrazione: {registration_id}")
    
    return {"ok": True, "message": "Dati sensibili eliminati. Conservati solo dati essenziali."}


async def _get_member_emails() -> set:
    cursor = db.members.find({}, {"email": 1, "_id": 0})
    docs = await cursor.to_list(10000)
    return {(d.get("email") or "").lower() for d in docs if d.get("email")}


@api_router.get("/admin/contacts", dependencies=[Depends(require_admin)])
async def admin_contacts():
    docs = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.delete("/admin/{collection}/{doc_id}", dependencies=[Depends(require_admin)])
async def admin_delete(collection: str, doc_id: str):
    allowed = {
        "event-signups": "event_signups",
        "memberships": "memberships",
        "contacts": "contacts",
        "events": "events",
        "members": "members",
        "registrations": "registrations",
    }
    if collection not in allowed:
        raise HTTPException(status_code=400, detail="Collezione non valida")
    
    target_collection = allowed[collection]

    if target_collection == "event_signups":
        signup = await db.event_signups.find_one({"id": doc_id})
        if signup and signup.get("confirmed") is True:
            await db.events.update_one(
                {"id": signup["event_id"]},
                {"$inc": {"spots": 1}}
            )

    res = await db[target_collection].delete_one({"id": doc_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Documento non trovato")
        
    return {"ok": True}


# ========== ADMIN: MEMBERS ==========
@api_router.get("/admin/members", dependencies=[Depends(require_admin)])
async def admin_get_members():
    docs = await db.members.find({}, {"_id": 0}).sort("joined_at", -1).to_list(10000)
    return docs


@api_router.post("/admin/members", response_model=Member, dependencies=[Depends(require_admin)])
async def admin_create_member(payload: MemberCreate):
    email = payload.email.lower()
    existing = await db.members.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Esiste già un socio con questa email")
    obj = Member(**{**payload.model_dump(), "email": email})
    doc = obj.model_dump()
    doc["joined_at"] = doc["joined_at"].isoformat()
    await db.members.insert_one(doc)
    return obj


@api_router.put("/admin/members/{member_id}", response_model=Member, dependencies=[Depends(require_admin)])
async def admin_update_member(member_id: str, payload: MemberUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "email" in update:
        update["email"] = update["email"].lower()
    if not update:
        raise HTTPException(status_code=400, detail="Niente da aggiornare")
    res = await db.members.update_one({"id": member_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Socio non trovato")
    doc = await db.members.find_one({"id": member_id}, {"_id": 0})
    return doc


@api_router.post("/admin/members/from-request/{request_id}", response_model=Member, dependencies=[Depends(require_admin)])
async def admin_member_from_request(request_id: str, body: Optional[dict] = None):
    req = await db.memberships.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    email = (req.get("email") or "").lower()
    existing = await db.members.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Già nel registro tesserati")
    member = Member(
        first_name=req.get("first_name", ""),
        last_name=req.get("last_name", ""),
        email=email,
        phone=req.get("phone"),
        tessera_number=(body or {}).get("tessera_number") if body else None,
        notes=req.get("motivation"),
    )
    doc = member.model_dump()
    doc["joined_at"] = doc["joined_at"].isoformat()
    await db.members.insert_one(doc)
    return member


@api_router.post("/admin/event-signups/{signup_id}/confirm", dependencies=[Depends(require_admin)])
async def confirm_event_signup(signup_id: str):
    signup = await db.event_signups.find_one({"id": signup_id}, {"_id": 0})
    if not signup:
        raise HTTPException(status_code=404, detail="Iscrizione non trovata")
    
    event = await db.events.find_one({"id": signup["event_id"]}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    
    if event.get("spots", 0) <= 0:
        raise HTTPException(status_code=400, detail="Nessun posto disponibile")
    
    await db.events.update_one(
        {"id": signup["event_id"]},
        {"$inc": {"spots": -1}}
    )
    await db.event_signups.update_one(
        {"id": signup_id},
        {"$set": {"confirmed": True}}
    )
    return {"ok": True, "spots_remaining": event["spots"] - 1}


# ========== ADMIN: EVENTS ==========
@api_router.get("/admin/events", dependencies=[Depends(require_admin)])
async def admin_get_events():
    docs = await db.events.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    return docs


@api_router.post("/admin/events", response_model=Event, dependencies=[Depends(require_admin)])
async def admin_create_event(payload: EventCreate):
    data = payload.model_dump()
    data["id"] = str(uuid.uuid4())
    data["slug"] = (data.get("slug") or make_slug(data["title"])) + "-" + data["id"][:6]
    await db.events.insert_one(dict(data))
    return Event(**data)


@api_router.put("/admin/events/{event_id}", response_model=Event, dependencies=[Depends(require_admin)])
async def admin_update_event(event_id: str, payload: EventUpdate):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Niente da aggiornare")
    res = await db.events.update_one({"id": event_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    return doc


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def seed_events_on_startup():
    try:
        count = await db.events.count_documents({})
        if count == 0:
            seeded = []
            for e in EVENTS:
                doc = dict(e)
                doc.setdefault("slug", make_slug(doc["title"]) + "-" + doc["id"][-4:])
                seeded.append(doc)
            if seeded:
                await db.events.insert_many(seeded)
                logger.info(f"Seeded {len(seeded)} events")
    except Exception as ex:
        logger.error(f"Event seed failed: {ex}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
