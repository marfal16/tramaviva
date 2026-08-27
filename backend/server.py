from fastapi import FastAPI, APIRouter, BackgroundTasks, HTTPException, Depends, Header, Response
import base64
import re
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import sys

import hashlib
import secrets
import jwt as pyjwt

# IMPORTANTE: Importiamo il servizio PDF che hai appena configurato
from pdf_service import PDFService
from email_service import EmailService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL not set in environment variables")

client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tramaviva')]

app = FastAPI(title="Trama Viva APS")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== MODELS ==========
class GuestInfo(BaseModel):
    nome: str
    cognome: str
    phone: Optional[str] = None
    email: Optional[str] = None

class EventSignupCreate(BaseModel):
    event_id: str
    event_title: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None
    referral: Optional[str] = None
    metodo_pagamento: Optional[str] = None
    num_persone: int = 1
    ospiti: List[GuestInfo] = []
    donazione_volontaria: Optional[float] = None
    opzione_scelta: Optional[str] = None

class EventSignup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    event_title: str
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    referral: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed: bool = False
    metodo_pagamento: Optional[str] = None
    payment_completed: bool = False
    num_persone: int = 1
    ospiti: List[GuestInfo] = []
    donazione_volontaria: Optional[float] = None
    opzione_scelta: Optional[str] = None

class MembershipCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    birthdate: Optional[str] = None
    motivation: Optional[str] = None
    referral: Optional[str] = None

class Membership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    birthdate: Optional[str] = None
    motivation: Optional[str] = None
    referral: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    message: str

class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Event(BaseModel):
    id: str
    slug: str
    title: str
    category: str
    date: str
    time: str
    location: str
    description: str
    emoji: str
    spots: int
    featured: bool = False
    contributo: float = 0.0
    contributo_note: Optional[str] = None
    non_rimborsabile: bool = False
    solo_soci: bool = False
    has_image: bool = False
    contributo_volontario: bool = False
    opzioni_label: Optional[str] = None
    opzioni_custom: Optional[str] = None

class EventCreate(BaseModel):
    title: str
    category: str
    date: str
    time: str
    location: str
    description: str
    emoji: str = "✨"
    spots: int = 20
    slug: Optional[str] = None
    featured: bool = False
    contributo: float = 0.0
    contributo_note: Optional[str] = None
    non_rimborsabile: bool = False
    solo_soci: bool = False
    contributo_volontario: bool = False
    opzioni_label: Optional[str] = None
    opzioni_custom: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    spots: Optional[int] = None
    featured: Optional[bool] = None
    contributo: Optional[float] = None
    contributo_note: Optional[str] = None
    non_rimborsabile: Optional[bool] = None
    solo_soci: Optional[bool] = None
    contributo_volontario: Optional[bool] = None
    opzioni_label: Optional[str] = None
    opzioni_custom: Optional[str] = None

class ImageUpload(BaseModel):
    image_data: str  # base64 dataURL

class PaymentRequest(BaseModel):
    amount: float
    email: str
    description: str
    registration_id: Optional[str] = None

class PaymentStatusUpdate(BaseModel):
    payment_completed: bool

class BulkConfirmPayload(BaseModel):
    signup_ids: List[str]

class Book(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    status: str = "in_lettura"  # "in_lettura" | "concluso" | "prossimamente"
    reading_month: Optional[str] = None  # "YYYY-MM" del mese di lettura
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    recensione: Optional[str] = None
    linked_event_ids: List[str] = Field(default_factory=list)
    pages: Optional[int] = None
    in_biblioteca: bool = False
    is_lent: bool = False
    is_to_find: bool = False
    quantity: int = Field(default=1, ge=1)
    lent_to: Optional[str] = None
    lent_date: Optional[str] = None
    is_library_book: Optional[bool] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookCreate(BaseModel):
    title: str
    author: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    status: str = "in_lettura"
    reading_month: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    recensione: Optional[str] = None
    linked_event_ids: List[str] = Field(default_factory=list)
    pages: Optional[int] = None
    in_biblioteca: bool = False
    is_lent: bool = False
    is_to_find: bool = False
    quantity: int = Field(default=1, ge=1)
    lent_to: Optional[str] = None
    lent_date: Optional[str] = None
    is_library_book: Optional[bool] = None

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = None
    reading_month: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    recensione: Optional[str] = None
    linked_event_ids: Optional[List[str]] = None
    pages: Optional[int] = None
    in_biblioteca: Optional[bool] = None
    is_lent: Optional[bool] = None
    is_to_find: Optional[bool] = None
    quantity: Optional[int] = None
    lent_to: Optional[str] = None
    lent_date: Optional[str] = None
    is_library_book: Optional[bool] = None

class BookProposal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    proposed_month: str  # "YYYY-MM"
    votes: int = 0
    nome: Optional[str] = None
    cognome: Optional[str] = None
    in_community_whatsapp: Optional[bool] = None
    voters: List[dict] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookProposalCreate(BaseModel):
    title: str
    author: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    proposed_month: Optional[str] = None
    nome: Optional[str] = None
    cognome: Optional[str] = None
    in_community_whatsapp: Optional[bool] = None

class VoterCreate(BaseModel):
    nome: Optional[str] = None
    cognome: Optional[str] = None
    in_community_whatsapp: Optional[bool] = None

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    book_id: str
    book_title: str = ""
    reviewer_name: str
    content: str
    rating: int = Field(default=5, ge=1, le=5)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewCreate(BaseModel):
    reviewer_name: str
    content: str
    rating: int = Field(default=5, ge=1, le=5)

# ========== FILM MODELS ==========

class Film(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    director: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    duration: Optional[int] = None  # minuti
    status: str = "prossimamente"  # "in_visione" | "concluso" | "prossimamente"
    screening_month: Optional[str] = None  # "YYYY-MM"
    description: Optional[str] = None
    recensione: Optional[str] = None
    trailer_url: Optional[str] = None
    discussion_topics: Optional[str] = None
    external_reviews: List[dict] = Field(default_factory=list)
    linked_event_ids: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FilmCreate(BaseModel):
    title: str
    director: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    duration: Optional[int] = None
    status: str = "prossimamente"
    screening_month: Optional[str] = None
    description: Optional[str] = None
    recensione: Optional[str] = None
    trailer_url: Optional[str] = None
    discussion_topics: Optional[str] = None
    external_reviews: List[dict] = Field(default_factory=list)
    linked_event_ids: List[str] = Field(default_factory=list)

class FilmUpdate(BaseModel):
    title: Optional[str] = None
    director: Optional[str] = None
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    year: Optional[int] = None
    duration: Optional[int] = None
    status: Optional[str] = None
    screening_month: Optional[str] = None
    description: Optional[str] = None
    recensione: Optional[str] = None
    trailer_url: Optional[str] = None
    discussion_topics: Optional[str] = None
    external_reviews: Optional[List[dict]] = None
    linked_event_ids: Optional[List[str]] = None

class FilmProposal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    director: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    trailer_url: Optional[str] = None
    discussion_topics: Optional[str] = None
    external_reviews: List[dict] = Field(default_factory=list)
    proposed_month: str  # "YYYY-MM"
    votes: int = 0
    nome: Optional[str] = None
    cognome: Optional[str] = None
    in_community_whatsapp: Optional[bool] = None
    voters: List[dict] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FilmProposalCreate(BaseModel):
    title: str
    director: str
    cover_url: Optional[str] = None
    genre: Optional[str] = None
    description: Optional[str] = None
    trailer_url: Optional[str] = None
    discussion_topics: Optional[str] = None
    external_reviews: List[dict] = Field(default_factory=list)
    proposed_month: Optional[str] = None
    nome: Optional[str] = None
    cognome: Optional[str] = None
    in_community_whatsapp: Optional[bool] = None

class FilmReview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    film_id: str
    film_title: str = ""
    reviewer_name: str
    content: str
    rating: int = Field(default=5, ge=1, le=5)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FilmReviewCreate(BaseModel):
    reviewer_name: str
    content: str
    rating: int = Field(default=5, ge=1, le=5)

class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    tessera_number: Optional[str] = None
    notes: Optional[str] = None

class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    tessera_number: Optional[str] = None
    notes: Optional[str] = None
    is_fondatore: bool = False
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    tessera_number: Optional[str] = None
    notes: Optional[str] = None
    is_fondatore: Optional[bool] = None

class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    reward: str
    required_events: int = 1
    emoji: str = "🏆"
    event_id: Optional[str] = None    # evento specifico (priorità su category)
    event_title: Optional[str] = None # denormalizzato per display
    category: Optional[str] = None    # conta eventi per categoria
    order: int = 0
    active: bool = True

class MissionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reward: Optional[str] = None
    required_events: Optional[int] = None
    emoji: Optional[str] = None
    event_id: Optional[str] = None
    event_title: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

class RegistrationCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    referral: Optional[str] = None
    luogo_nascita: Optional[str] = None
    data_nascita: str
    codice_fiscale: str
    cittadinanza: Optional[str] = None
    documento_tipo: str
    documento_numero: Optional[str] = None
    documento_rilasciato: Optional[str] = None
    documento_data: Optional[str] = None
    indirizzo: str
    comune: str
    provincia: Optional[str] = None
    cap: str
    cellulare: str
    is_minorenne: bool = False
    genitore_nome: Optional[str] = None
    genitore_cognome: Optional[str] = None
    genitore_telefono: Optional[str] = None
    genitore_documento_tipo: Optional[str] = None
    genitore_documento_numero: Optional[str] = None
    genitore_luogo_nascita: Optional[str] = None
    genitore_data_nascita: Optional[str] = None
    genitore_codice_fiscale: Optional[str] = None
    consenso_comunicazioni: bool
    consenso_pubblico: bool
    consenso_telefono: bool
    consenso_chat: bool
    consenso_privacy: bool
    consenso_dati: bool
    dichiarazione_accettata: bool
    metodo_pagamento: Optional[str] = None

class DonationCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    amount: Optional[float] = None
    message: Optional[str] = None
    metodo_pagamento: str = "bonifico"

class Donation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    amount: Optional[float] = None
    message: Optional[str] = None
    metodo_pagamento: str = "bonifico"
    status: str = "pending"
    note: Optional[str] = None
    sumup_checkout_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Registration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: str
    referral: Optional[str] = None
    data_nascita: str
    codice_fiscale: str
    luogo_nascita: Optional[str] = None
    cittadinanza: Optional[str] = None
    documento_tipo: str
    documento_numero: Optional[str] = None
    documento_rilasciato: Optional[str] = None
    documento_data: Optional[str] = None
    indirizzo: str
    comune: str
    provincia: Optional[str] = None
    cap: str
    cellulare: str
    is_minorenne: bool = False
    genitore_nome: Optional[str] = None
    genitore_cognome: Optional[str] = None
    genitore_telefono: Optional[str] = None
    genitore_documento_tipo: Optional[str] = None
    genitore_documento_numero: Optional[str] = None
    genitore_luogo_nascita: Optional[str] = None
    genitore_data_nascita: Optional[str] = None
    genitore_codice_fiscale: Optional[str] = None
    consenso_comunicazioni: bool
    consenso_pubblico: bool
    consenso_privacy: bool
    consenso_dati: bool
    pdf_base64: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"
    metodo_pagamento: Optional[str] = None
    payment_completed: bool = False
    document_downloaded: bool = False
    tessera_number: Optional[str] = None

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
    try:
        docs = await db.events.find({}, {"_id": 0, "image_data": 0}).sort("date", 1).to_list(1000)
        return docs or []
    except Exception as e:
        logger.error(f"Errore nel caricamento eventi: {e}")
        return []

@api_router.get("/events/{event_id}/image")
async def get_event_image(event_id: str):
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"image_data": 1, "_id": 0})
    if not doc or not doc.get("image_data"):
        raise HTTPException(status_code=404, detail="Immagine non trovata")
    data_url = doc["image_data"]
    if "," in data_url:
        header, b64 = data_url.split(",", 1)
        content_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    else:
        b64, content_type = data_url, "image/jpeg"
    return Response(content=base64.b64decode(b64), media_type=content_type)

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"_id": 0, "image_data": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    return doc

@api_router.get("/events/{event_id}/signups-count")
async def get_event_signups_count(event_id: str):
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    pipeline = [
        {"$match": {"event_id": doc["id"]}},
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$num_persone", 1]}}}}
    ]
    result = await db.event_signups.aggregate(pipeline).to_list(1)
    count = result[0]["total"] if result else 0
    return {"count": count}

# ========== ROUTES: EVENT SIGNUPS & MEMBERSHIPS ==========
@api_router.post("/event-signup", response_model=EventSignup)
async def create_event_signup(payload: EventSignupCreate):
    # Controllo accesso: eventi solo soci
    event_doc = await db.events.find_one({"id": payload.event_id})
    if event_doc and event_doc.get("solo_soci"):
        email = (payload.email or "").lower().strip()
        is_member  = await db.members.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        is_pending = await db.registrations.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        if not is_member and not is_pending:
            raise HTTPException(
                status_code=403,
                detail="Questo evento è riservato ai soci Trama Viva. Per partecipare devi essere socio o avere una richiesta di iscrizione in corso."
            )
    obj = EventSignup(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.event_signups.insert_one(doc)
    try:
        email_svc = EmailService()
        await email_svc.send_admin_notification(
            subject="Nuova richiesta evento",
            info={"Evento": obj.event_title, "Nome": obj.name, "Email": obj.email, "Telefono": obj.phone or "—"},
        )
    except Exception as e:
        logger.warning(f"Notifica admin evento non inviata: {e}")
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
    try:
        email_svc = EmailService()
        await email_svc.send_admin_notification(
            subject="Nuovo messaggio contatti",
            info={"Nome": obj.name, "Email": obj.email, "Messaggio": obj.message},
        )
    except Exception as e:
        logger.warning(f"Notifica admin contatti non inviata: {e}")
    return obj

# ========== ROUTES: REGISTRATIONS ==========
@api_router.post("/registrations/create")
async def create_registration(payload: RegistrationCreate):
    try:
        registration_data = payload.model_dump()
        
        # FISSAATO: Ora richiamiamo correttamente il PDFService compilando il file
        pdf_base64 = PDFService.generate_pdf_from_registration(registration_data)
        
        registration = Registration(
            **registration_data,
            pdf_base64=pdf_base64,
            status="pending"
        )
        
        doc = registration.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        result = await db.registrations.insert_one(doc)
        logger.info(f"Registrazione creata con successo con PDF: {registration.id}")

        try:
            email_svc = EmailService()
            await email_svc.send_registration_confirmation(
                email=registration.email,
                first_name=registration.first_name,
                registration_id=registration.id,
            )
        except Exception as e:
            logger.warning(f"Email conferma iscrizione non inviata: {e}")

        try:
            email_svc = EmailService()
            await email_svc.send_admin_notification(
                subject="Nuova richiesta iscrizione",
                info={
                    "Nome": f"{registration.first_name} {registration.last_name}",
                    "Email": registration.email,
                    "Telefono": registration.phone or "—",
                    "Pagamento": registration.metodo_pagamento or "—",
                },
            )
        except Exception as e:
            logger.warning(f"Notifica admin iscrizione non inviata: {e}")

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
    """Marca una registrazione come pagata e completed."""
    try:
        registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
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
        logger.info(f"Pagamento confermato per registrazione: {registration_id}")
        return {"ok": True, "message": "Pagamento registrato correttamente."}
    except Exception as e:
        logger.error(f"Errore nel completamento pagamento: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ========== ROUTES: PAYMENTS ==========
@api_router.post("/payments/create-checkout")
async def create_sumup_checkout(payload: PaymentRequest):
    api_key = os.environ.get("SUMUP_API_KEY")
    merchant_code = os.environ.get("SUMUP_MERCHANT_CODE")
    
    if not api_key or not merchant_code:
        logger.warning("SumUp not configured, returning test checkout")
        return {
            "id": "test-checkout-" + str(uuid.uuid4())[:8],
            "status": "PENDING",
            "checkout_url": "https://www.tramavivaaps.com"
        }

    formatted_amount = round(payload.amount, 2)
    checkout_reference = f"tv-{str(uuid.uuid4())[:8]}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client_http:
            url = "https://api.sumup.com/v0.1/checkouts"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            redirect_base = "https://www.tramavivaaps.com"
            redirect_url = (
                f"{redirect_base}/?paid={payload.registration_id}"
                if payload.registration_id
                else redirect_base
            )
            checkout_data = {
                "merchant_code": merchant_code,
                "amount": formatted_amount,
                "currency": "EUR",
                "checkout_reference": checkout_reference,
                "description": payload.description,
                "redirect_url": redirect_url,
                "hosted_checkout": {
                    "enabled": True
                }
            }

            response = await client_http.post(url, json=checkout_data, headers=headers)
            
            if response.status_code not in [200, 201]:
                logger.warning(f"SumUp API error: {response.status_code}")
                return {
                    "id": "test-checkout-" + str(uuid.uuid4())[:8],
                    "status": "PENDING",
                    "checkout_url": "https://www.tramavivaaps.com"
                }
            
            res_json = response.json()
            return {
                "id": res_json.get("id"),
                "status": res_json.get("status"),
                "checkout_url": res_json.get("hosted_checkout_url")
            }
            
    except Exception as exc:
        logger.warning(f"SumUp error: {exc}")
        return {
            "id": "test-checkout-" + str(uuid.uuid4())[:8],
            "status": "PENDING",
            "checkout_url": "https://www.tramavivaaps.com"
        }

# ========== ADMIN AUTH ==========
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "admin123")

# ========== SOCIO AUTH ==========
JWT_SECRET = os.environ.get("JWT_SECRET", "tramaviva-secret-CHANGE-IN-PRODUCTION")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://www.tramavivaaps.com")

class SocioCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str

class SocioLogin(BaseModel):
    email: EmailStr
    password: str

class SocioUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class AvatarUpload(BaseModel):
    image_data: str  # base64 dataURL

def _hash_password(password: str) -> str:
    salt = secrets.token_hex(32)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"pbkdf2:sha256:260000:{salt}:{dk.hex()}"

def _verify_password(plain: str, stored: str) -> bool:
    try:
        _, algo, iters, salt, key = stored.split(":")
        dk = hashlib.pbkdf2_hmac(algo, plain.encode(), salt.encode(), int(iters))
        return secrets.compare_digest(dk.hex(), key)
    except Exception:
        return False

def _create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    return pyjwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def require_socio(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Accesso riservato ai soci")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token non valido")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta, effettua di nuovo il login")
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "avatar_data": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return user

def require_admin(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token mancante")
    token = authorization.split(" ", 1)[1].strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token non valido")
    return True

# ========== ROUTES: DONATIONS ==========

@api_router.post("/donations")
async def create_donation(payload: DonationCreate):
    try:
        donation = Donation(**payload.model_dump())
        checkout_url = None

        if donation.metodo_pagamento == "sumup":
            api_key = os.environ.get("SUMUP_API_KEY")
            merchant_code = os.environ.get("SUMUP_MERCHANT_CODE")
            amount = donation.amount or 10.0
            if api_key and merchant_code:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client_http:
                        redirect_url = f"{FRONTEND_URL}/donazioni?grazie={donation.id}"
                        checkout_data = {
                            "merchant_code": merchant_code,
                            "amount": round(amount, 2),
                            "currency": "EUR",
                            "checkout_reference": f"don-{donation.id[:8]}",
                            "description": f"Donazione Trama Viva - {donation.first_name} {donation.last_name}",
                            "redirect_url": redirect_url,
                            "hosted_checkout": {"enabled": True},
                        }
                        r = await client_http.post(
                            "https://api.sumup.com/v0.1/checkouts",
                            json=checkout_data,
                            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                        )
                        if r.status_code in (200, 201):
                            rj = r.json()
                            checkout_url = rj.get("hosted_checkout_url")
                            donation.sumup_checkout_id = rj.get("id")
                except Exception as e:
                    logger.warning(f"SumUp donation checkout error: {e}")
            if not checkout_url:
                checkout_url = f"{FRONTEND_URL}/donazioni?grazie={donation.id}"

        await db.donations.insert_one(donation.model_dump())
        return {"id": donation.id, "checkout_url": checkout_url}
    except Exception as e:
        logger.error(f"Errore creazione donazione: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/admin/donations", dependencies=[Depends(require_admin)])
async def list_donations():
    docs = await db.donations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.put("/admin/donations/{donation_id}", dependencies=[Depends(require_admin)])
async def update_donation(donation_id: str, data: dict, background_tasks: BackgroundTasks):
    allowed = {k: v for k, v in data.items() if k in ("status", "note")}
    if not allowed:
        return {"ok": True}
    current = await db.donations.find_one({"id": donation_id}, {"_id": 0})
    await db.donations.update_one({"id": donation_id}, {"$set": allowed})
    if (
        current
        and allowed.get("status") == "completed"
        and current.get("status") != "completed"
    ):
        email_svc = EmailService()
        background_tasks.add_task(
            email_svc.send_donation_thank_you,
            current.get("email", ""),
            current.get("first_name", ""),
            current.get("amount"),
        )
    return {"ok": True}


@api_router.delete("/admin/donations/{donation_id}", dependencies=[Depends(require_admin)])
async def delete_donation(donation_id: str):
    await db.donations.delete_one({"id": donation_id})
    return {"ok": True}


@api_router.post("/admin/login")
async def admin_login(payload: dict):
    token = (payload or {}).get("token", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Password non valida")
    return {"ok": True}

# ========== SOCIO AUTH ENDPOINTS ==========

@api_router.post("/auth/register")
async def socio_register(payload: SocioCreate):
    email = payload.email.lower().strip()
    member = await db.members.find_one({"email": re.compile(f"^{re.escape(email)}$", re.IGNORECASE)})
    if not member:
        raise HTTPException(status_code=403, detail="Email non trovata nel registro soci. Contatta l'associazione per diventare socio.")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Esiste già un account con questa email.")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.users.insert_one({
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": _hash_password(payload.password),
        "bio": None,
        "has_avatar": False,
        "created_at": now,
    })
    token = _create_access_token(user_id)
    return {"token": token, "user": {"id": user_id, "email": email, "name": payload.name.strip(), "bio": None, "has_avatar": False}}

@api_router.post("/auth/login")
async def socio_login(payload: SocioLogin):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not _verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email o password non corretti.")
    token = _create_access_token(user["id"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "bio": user.get("bio"), "has_avatar": user.get("has_avatar", False)}}

@api_router.get("/auth/me")
async def socio_me(user=Depends(require_socio)):
    return user

@api_router.put("/auth/me")
async def socio_update_profile(payload: SocioUpdate, user=Depends(require_socio)):
    update = {}
    if payload.name is not None:
        update["name"] = payload.name.strip()
    if payload.bio is not None:
        update["bio"] = payload.bio.strip() or None
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0, "avatar_data": 0})
    return updated

@api_router.post("/auth/me/change-password")
async def socio_change_password(payload: PasswordChange, user=Depends(require_socio)):
    full_user = await db.users.find_one({"id": user["id"]})
    if not _verify_password(payload.current_password, full_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Password attuale non corretta.")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": _hash_password(payload.new_password)}})
    return {"ok": True}

@api_router.post("/auth/me/avatar")
async def socio_upload_avatar(payload: AvatarUpload, user=Depends(require_socio)):
    if not payload.image_data.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Formato immagine non valido.")
    await db.users.update_one({"id": user["id"]}, {"$set": {"avatar_data": payload.image_data, "has_avatar": True}})
    return {"ok": True}

@api_router.get("/users/{user_id}/avatar")
async def get_user_avatar(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"avatar_data": 1, "_id": 0})
    if not user or not user.get("avatar_data"):
        raise HTTPException(status_code=404, detail="Avatar non trovato")
    data_url = user["avatar_data"]
    if "," in data_url:
        header, b64 = data_url.split(",", 1)
        content_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    else:
        b64, content_type = data_url, "image/jpeg"
    return Response(content=base64.b64decode(b64), media_type=content_type)

@api_router.post("/auth/forgot-password")
async def socio_forgot_password(payload: PasswordResetRequest):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if user:
        token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        await db.password_reset_tokens.delete_many({"user_id": user["id"]})
        await db.password_reset_tokens.insert_one({
            "token": token, "user_id": user["id"], "email": email, "expires_at": expires_at,
        })
        reset_url = f"{FRONTEND_URL}/reset-password/{token}"
        try:
            email_svc = EmailService()
            await email_svc.send_password_reset(email, user.get("name", ""), reset_url)
        except Exception as e:
            logger.error(f"Errore invio email reset: {e}")
    return {"ok": True}

@api_router.post("/auth/reset-password")
async def socio_reset_password(payload: PasswordReset):
    record = await db.password_reset_tokens.find_one({"token": payload.token})
    if not record:
        raise HTTPException(status_code=400, detail="Link non valido o già utilizzato.")
    expires = record["expires_at"]
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Link scaduto. Richiedine uno nuovo.")
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password_hash": _hash_password(payload.new_password)}})
    await db.password_reset_tokens.delete_one({"token": payload.token})
    return {"ok": True}

@api_router.get("/auth/me/events")
async def socio_my_events(user=Depends(require_socio)):
    member = await db.members.find_one({"email": re.compile(f"^{re.escape(user['email'])}$", re.IGNORECASE)})
    is_fondatore = (member.get("is_fondatore", False) or not member.get("tessera_number")) if member else False
    if is_fondatore:
        events = await db.events.find({}, {"_id": 0, "id": 1, "title": 1, "date": 1, "location": 1, "category": 1, "emoji": 1, "slug": 1}).sort("date", -1).to_list(500)
        return {"is_fondatore": True, "events": events, "signups": []}
    signups = await db.event_signups.find(
        {"email": re.compile(f"^{re.escape(user['email'])}$", re.IGNORECASE)},
        {"_id": 0, "id": 1, "event_id": 1, "event_title": 1, "created_at": 1, "confirmed": 1, "num_persone": 1}
    ).sort("created_at", -1).to_list(200)
    return {"is_fondatore": False, "events": [], "signups": signups}

@api_router.get("/auth/me/member-info")
async def socio_member_info(user=Depends(require_socio)):
    member = await db.members.find_one(
        {"email": re.compile(f"^{re.escape(user['email'])}$", re.IGNORECASE)},
        {"_id": 0, "first_name": 1, "last_name": 1, "tessera_number": 1, "joined_at": 1, "is_fondatore": 1, "phone": 1}
    )
    return member or {}

@api_router.get("/auth/me/reviews")
async def socio_my_reviews(user=Depends(require_socio)):
    name = user.get("name", "").strip()
    reviews = await db.reviews.find(
        {"reviewer_name": re.compile(f"^{re.escape(name)}$", re.IGNORECASE)},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return reviews

@api_router.get("/auth/me/votes")
async def socio_my_votes(user=Depends(require_socio)):
    name_parts = user.get("name", "").strip().split()
    if len(name_parts) < 2:
        return []
    nome = name_parts[0]
    cognome = " ".join(name_parts[1:])
    proposals = await db.proposals.find(
        {"voters": {"$elemMatch": {
            "nome": re.compile(f"^{re.escape(nome)}$", re.IGNORECASE),
            "cognome": re.compile(f"^{re.escape(cognome)}$", re.IGNORECASE)
        }}},
        {"_id": 0, "id": 1, "title": 1, "author": 1, "votes": 1, "proposed_month": 1, "cover_url": 1}
    ).sort("proposed_month", -1).to_list(100)
    return proposals

@api_router.get("/auth/me/film-reviews")
async def socio_my_film_reviews(user=Depends(require_socio)):
    name = user.get("name", "").strip()
    reviews = await db.film_reviews.find(
        {"reviewer_name": re.compile(f"^{re.escape(name)}$", re.IGNORECASE)},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return reviews

@api_router.get("/auth/me/film-votes")
async def socio_my_film_votes(user=Depends(require_socio)):
    name_parts = user.get("name", "").strip().split()
    if len(name_parts) < 2:
        return []
    nome = name_parts[0]
    cognome = " ".join(name_parts[1:])
    proposals = await db.film_proposals.find(
        {"voters": {"$elemMatch": {
            "nome": re.compile(f"^{re.escape(nome)}$", re.IGNORECASE),
            "cognome": re.compile(f"^{re.escape(cognome)}$", re.IGNORECASE)
        }}},
        {"_id": 0, "id": 1, "title": 1, "director": 1, "votes": 1, "proposed_month": 1, "cover_url": 1}
    ).sort("proposed_month", -1).to_list(100)
    return proposals

# ========== MISSIONI SOCI ==========

@api_router.get("/auth/me/missions")
async def socio_my_missions(user=Depends(require_socio)):
    member = await db.members.find_one({"email": re.compile(f"^{re.escape(user['email'])}$", re.IGNORECASE)})
    is_fondatore = (member.get("is_fondatore", False) or not member.get("tessera_number")) if member else False

    if is_fondatore:
        all_events = await db.events.find({}, {"_id": 0, "id": 1, "category": 1}).to_list(2000)
        attended_ids: set = {e["id"] for e in all_events}
        total_count = len(all_events)
        category_counts: dict = {}
        for ev in all_events:
            cat = (ev.get("category") or "").strip()
            if cat:
                category_counts[cat] = category_counts.get(cat, 0) + 1
    else:
        email_re = re.compile(f"^{re.escape(user['email'])}$", re.IGNORECASE)
        signups = await db.event_signups.find(
            {"email": email_re, "confirmed": True},
            {"_id": 0, "event_id": 1}
        ).to_list(2000)
        attended_ids: set = {s["event_id"] for s in signups}
        total_count = len(attended_ids)
        category_counts: dict = {}
        if attended_ids:
            events = await db.events.find(
                {"id": {"$in": list(attended_ids)}},
                {"_id": 0, "id": 1, "category": 1}
            ).to_list(2000)
            for ev in events:
                cat = (ev.get("category") or "").strip()
                if cat:
                    category_counts[cat] = category_counts.get(cat, 0) + 1

    missions = await db.missions.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    for m in missions:
        eid = m.get("event_id")
        cat = (m.get("category") or "").strip()
        if eid:
            # Missione legata a evento specifico — binario
            current = 1 if eid in attended_ids else 0
            m["current_count"] = current
            m["unlocked"] = current >= 1
        elif cat:
            current = category_counts.get(cat, 0)
            m["current_count"] = current
            m["unlocked"] = current >= m["required_events"]
        else:
            m["current_count"] = total_count
            m["unlocked"] = total_count >= m["required_events"]

    return {"event_count": total_count, "category_counts": category_counts, "is_fondatore": is_fondatore, "missions": missions}

# ========== BACHECA SOCI (SOCIAL FEED) ==========

class PostCreate(BaseModel):
    content: str
    image_data: Optional[str] = None  # base64 data URL

class CommentCreate(BaseModel):
    content: str

@api_router.get("/posts")
async def list_posts(user=Depends(require_socio), skip: int = 0, limit: int = 20):
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.posts.count_documents({})
    return {"posts": posts, "total": total}

@api_router.post("/posts", status_code=201)
async def create_post(body: PostCreate, user=Depends(require_socio)):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Il post non può essere vuoto")
    post_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    post = {
        "id": post_id,
        "user_id": user["id"],
        "user_name": user.get("name", "Socio"),
        "content": body.content.strip(),
        "has_image": bool(body.image_data),
        "created_at": now,
        "likes": [],
        "comments": [],
    }
    if body.image_data:
        post["image_data"] = body.image_data
    await db.posts.insert_one(post)
    post.pop("image_data", None)
    return post

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user=Depends(require_socio)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trovato")
    if post["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.posts.delete_one({"id": post_id})
    return {"ok": True}

@api_router.get("/posts/{post_id}/image")
async def get_post_image(post_id: str):
    post = await db.posts.find_one({"id": post_id}, {"image_data": 1})
    if not post or not post.get("image_data"):
        raise HTTPException(status_code=404, detail="Immagine non trovata")
    data_url = post["image_data"]
    if "," in data_url:
        header, b64 = data_url.split(",", 1)
        mime = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    else:
        b64, mime = data_url, "image/jpeg"
    import base64
    img_bytes = base64.b64decode(b64)
    from fastapi.responses import Response
    return Response(content=img_bytes, media_type=mime)

@api_router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, user=Depends(require_socio)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trovato")
    uid = user["id"]
    if uid in post.get("likes", []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"likes": uid}})
        return {"liked": False}
    else:
        await db.posts.update_one({"id": post_id}, {"$addToSet": {"likes": uid}})
        return {"liked": True}

@api_router.post("/posts/{post_id}/comments", status_code=201)
async def add_comment(post_id: str, body: CommentCreate, user=Depends(require_socio)):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Il commento non può essere vuoto")
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trovato")
    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name", "Socio"),
        "content": body.content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.posts.update_one({"id": post_id}, {"$push": {"comments": comment}})
    return comment

@api_router.delete("/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, user=Depends(require_socio)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trovato")
    comment = next((c for c in post.get("comments", []) if c["id"] == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Commento non trovato")
    if comment["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    await db.posts.update_one({"id": post_id}, {"$pull": {"comments": {"id": comment_id}}})
    return {"ok": True}

# ========== ADMIN: MISSIONS ==========

@api_router.get("/admin/missions", dependencies=[Depends(require_admin)])
async def admin_get_missions():
    return await db.missions.find({}, {"_id": 0}).sort("order", 1).to_list(100)

@api_router.post("/admin/missions", dependencies=[Depends(require_admin)], status_code=201)
async def admin_create_mission(body: Mission):
    await db.missions.insert_one(body.model_dump())
    return body

@api_router.put("/admin/missions/{mission_id}", dependencies=[Depends(require_admin)])
async def admin_update_mission(mission_id: str, body: MissionUpdate):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.missions.update_one({"id": mission_id}, {"$set": update})
    return await db.missions.find_one({"id": mission_id}, {"_id": 0})

@api_router.delete("/admin/missions/{mission_id}", dependencies=[Depends(require_admin)])
async def admin_delete_mission(mission_id: str):
    await db.missions.delete_one({"id": mission_id})
    return {"ok": True}

# ========== ADMIN: MEMBERSHIPS & REGISTRATIONS ==========
@api_router.get("/admin/memberships", dependencies=[Depends(require_admin)])
async def admin_memberships():
    docs = await db.memberships.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    member_emails = await _get_member_emails()
    for d in docs:
        d["is_member"] = (d.get("email") or "").lower() in member_emails
    return docs

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

@api_router.get("/admin/contacts", dependencies=[Depends(require_admin)])
async def admin_contacts():
    docs = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

class AdminRegistrationCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = ""
    tessera_number: Optional[str] = None
    data_nascita: Optional[str] = ""
    codice_fiscale: Optional[str] = ""
    indirizzo: Optional[str] = ""
    comune: Optional[str] = ""
    cap: Optional[str] = ""
    note: Optional[str] = None

@api_router.post("/admin/registrations", dependencies=[Depends(require_admin)])
async def admin_create_registration(payload: AdminRegistrationCreate):
    reg = {
        "id": str(uuid.uuid4()),
        "first_name": payload.first_name.strip(),
        "last_name": payload.last_name.strip(),
        "email": payload.email.lower().strip(),
        "phone": payload.phone or "",
        "cellulare": payload.phone or "",
        "tessera_number": payload.tessera_number.strip() if payload.tessera_number else None,
        "data_nascita": payload.data_nascita or "",
        "codice_fiscale": payload.codice_fiscale or "",
        "indirizzo": payload.indirizzo or "",
        "comune": payload.comune or "",
        "cap": payload.cap or "",
        "documento_tipo": "CI",
        "consenso_privacy": True,
        "consenso_dati": True,
        "consenso_comunicazioni": False,
        "consenso_pubblico": False,
        "status": "pending",
        "payment_completed": True,
        "document_downloaded": False,
        "is_manual": True,
        "note": payload.note,
        "created_at": datetime.now(timezone.utc),
    }
    await db.registrations.insert_one(reg)
    reg.pop("_id", None)
    return reg

@api_router.get("/admin/registrations", dependencies=[Depends(require_admin)])
async def admin_get_registrations():
    docs = await db.registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    member_emails = await _get_member_emails()
    for doc in docs:
        doc.pop("pdf_base64", None)
        doc["is_member"] = (doc.get("email") or "").lower() in member_emails
    return docs

class TesseraAssign(BaseModel):
    tessera_number: str

@api_router.patch("/admin/registrations/{registration_id}/tessera", dependencies=[Depends(require_admin)])
async def assign_registration_tessera(registration_id: str, payload: TesseraAssign):
    num = payload.tessera_number.strip()
    existing_member = await db.members.find_one({"tessera_number": num}, {"_id": 0, "first_name": 1, "last_name": 1})
    if existing_member:
        name = f"{existing_member.get('first_name', '')} {existing_member.get('last_name', '')}".strip()
        raise HTTPException(status_code=409, detail=f"Il numero #{num} è già assegnato al socio {name}. Consulta i numeri disponibili nella sezione Soci tesserati.")
    existing_reg = await db.registrations.find_one(
        {"tessera_number": num, "id": {"$ne": registration_id}},
        {"_id": 0, "first_name": 1, "last_name": 1}
    )
    if existing_reg:
        name = f"{existing_reg.get('first_name', '')} {existing_reg.get('last_name', '')}".strip()
        raise HTTPException(status_code=409, detail=f"Il numero #{num} è già riservato a {name}.")
    result = await db.registrations.update_one({"id": registration_id}, {"$set": {"tessera_number": num}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    return {"ok": True}

@api_router.patch("/admin/registrations/{registration_id}/payment-status", dependencies=[Depends(require_admin)])
async def admin_update_payment_status(registration_id: str, payload: PaymentStatusUpdate):
    res = await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"payment_completed": payload.payment_completed}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registrazione non trovata")
    return {"ok": True}

# AGGIUNTO: Endpoint fondamentale per scaricare il PDF compilato dall'Admin
@api_router.get("/admin/registrations/{registration_id}/pdf", dependencies=[Depends(require_admin)])
async def admin_download_pdf(registration_id: str):
    try:
        registration = await db.registrations.find_one(
            {"id": registration_id},
            {"_id": 0, "pdf_base64": 0}
        )
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")

        # Rigenera il PDF al volo così ogni download usa le impostazioni correnti
        pdf_base64 = PDFService.generate_pdf_from_registration(registration)
        if not pdf_base64:
            raise HTTPException(status_code=500, detail="Errore nella generazione del PDF")

        await db.registrations.update_one(
            {"id": registration_id},
            {"$set": {"document_downloaded": True, "document_downloaded_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {
            "pdf_base64": pdf_base64,
            "filename": f"iscrizione_{registration['first_name']}_{registration['last_name']}_{registration_id[:8]}.pdf"
        }
    except Exception as e:
        logger.error(f"Errore nel download PDF: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/admin/registrations/{registration_id}/resend-confirmation", dependencies=[Depends(require_admin)])
async def admin_resend_confirmation(registration_id: str):
    try:
        reg = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
        if not reg:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
        email_svc = EmailService()
        await email_svc.send_registration_confirmation(
            email=reg["email"],
            first_name=reg.get("first_name", ""),
            registration_id=registration_id,
        )
        return {"ok": True, "message": "Email di conferma reinviata."}
    except Exception as e:
        logger.error(f"Errore reinvio email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AGGIUNTO: Endpoint per ripulire i dati sensibili dopo aver salvato il PDF
@api_router.post("/admin/registrations/{registration_id}/cleanup", dependencies=[Depends(require_admin)])
async def admin_cleanup_registration(registration_id: str):
    try:
        registration = await db.registrations.find_one({"id": registration_id})
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
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
        await db.registrations.replace_one({"id": registration_id}, cleaned_data)
        return {"ok": True, "message": "Dati sensibili eliminati con successo."}
    except Exception as e:
        logger.error(f"Errore nel cleanup: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# AGGIUNTO: Endpoint per approvare ufficialmente e tesserare l'utente inserendolo in "members"
@api_router.post("/admin/registrations/{registration_id}/approve", dependencies=[Depends(require_admin)])
async def admin_approve_registration(registration_id: str):
    try:
        registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
        if not registration:
            raise HTTPException(status_code=404, detail="Registrazione non trovata")
        
        tessera_num = registration.get("tessera_number")
        if tessera_num:
            conflict = await db.members.find_one({"tessera_number": tessera_num}, {"_id": 0, "first_name": 1, "last_name": 1})
            if conflict:
                name = f"{conflict.get('first_name', '')} {conflict.get('last_name', '')}".strip()
                raise HTTPException(status_code=409, detail=f"Il numero tessera #{tessera_num} è già assegnato a {name}. Aggiorna il numero prima di approvare.")
        member = Member(
            first_name=registration["first_name"],
            last_name=registration["last_name"],
            email=registration["email"].lower(),
            phone=registration.get("phone"),
            tessera_number=tessera_num,
            notes=f"Iscritto via Form Iscrizione Soci. Tipo: {registration.get('referral', 'Non specificato')}"
        )
        member_doc = member.model_dump()
        member_doc["joined_at"] = member_doc["joined_at"].isoformat()
        
        await db.members.insert_one(member_doc)
        await db.registrations.update_one(
            {"id": registration_id},
            {"$set": {"status": "approved", "promoted_to_member_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"ok": True, "message": f"Socio {member.first_name} creato correttamente."}
    except Exception as e:
        logger.error(f"Errore nell'approvazione: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def _get_member_emails() -> set:
    try:
        cursor = db.members.find({}, {"email": 1, "_id": 0})
        docs = await cursor.to_list(10000)
        return {(d.get("email") or "").lower() for d in docs if d.get("email")}
    except:
        return set()

@api_router.delete("/admin/{collection}/{doc_id}", dependencies=[Depends(require_admin)])
async def admin_delete(collection: str, doc_id: str):
    allowed = {
        "event-signups": "event_signups",
        "memberships": "memberships",
        "contacts": "contacts",
        "events": "events",
        "members": "members",
        "registrations": "registrations",
        "reviews": "reviews",
        "proposals": "proposals",
        "books": "books",
        "films": "films",
        "film-proposals": "film_proposals",
        "film-reviews": "film_reviews",
        "missions": "missions",
    }
    if collection not in allowed:
        raise HTTPException(status_code=400, detail="Collezione non valida")
    
    target_collection = allowed[collection]

    if target_collection == "event_signups":
        signup = await db.event_signups.find_one({"id": doc_id})
        if signup:
            if signup.get("confirmed") is True:
                await db.events.update_one(
                    {"id": signup["event_id"]},
                    {"$inc": {"spots": 1}}
                )
            if signup.get("email"):
                try:
                    event = await db.events.find_one({"id": signup.get("event_id", "")}, {"_id": 0})
                    email_svc = EmailService()
                    await email_svc.send_event_cancellation(
                        email=signup["email"],
                        name=signup.get("name", ""),
                        event_title=(event.get("title") if event else None) or signup.get("event_title", ""),
                        event_date=(event.get("date") if event else "") or "",
                        event_time=(event.get("time") if event else "") or "",
                        event_location=(event.get("location") if event else "") or "",
                    )
                except Exception as e:
                    logger.warning(f"Email cancellazione evento non inviata: {e}")

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
    
    num_persone = signup.get("num_persone", 1)
    if event.get("spots", 0) < num_persone:
        raise HTTPException(status_code=400, detail=f"Posti insufficienti (richiesti {num_persone}, disponibili {event.get('spots', 0)})")
    
    await db.events.update_one(
        {"id": signup["event_id"]},
        {"$inc": {"spots": -num_persone}}
    )
    await db.event_signups.update_one(
        {"id": signup_id},
        {"$set": {"confirmed": True}}
    )

    try:
        email_svc = EmailService()
        await email_svc.send_event_confirmation(
            email=signup.get("email", ""),
            name=signup.get("name", ""),
            event_title=event.get("title", signup.get("event_title", "")),
            event_date=event.get("date", ""),
            event_time=event.get("time", ""),
            event_location=event.get("location", ""),
        )
    except Exception as e:
        logger.warning(f"Email conferma evento non inviata: {e}")

    return {"ok": True, "spots_remaining": event["spots"] - 1}

@api_router.post("/admin/events/{event_id}/send-reminder", dependencies=[Depends(require_admin)])
async def send_event_reminder(event_id: str):
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "image_data": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    signups = await db.event_signups.find(
        {"event_id": event_id, "confirmed": True}, {"_id": 0}
    ).to_list(1000)
    if not signups:
        return {"ok": True, "sent": 0, "message": "Nessun iscritto confermato."}
    email_svc = EmailService()
    sent = 0
    for s in signups:
        try:
            await email_svc.send_event_reminder(
                email=s.get("email", ""),
                name=s.get("name", ""),
                event_title=event.get("title", ""),
                event_date=event.get("date", ""),
                event_time=event.get("time", ""),
                event_location=event.get("location", ""),
            )
            sent += 1
        except Exception as e:
            logger.warning(f"Reminder non inviato a {s.get('email')}: {e}")
    return {"ok": True, "sent": sent}

class NotifyParticipantPayload(BaseModel):
    email: str
    name: str
    subject: str
    body_text: str
    notification_type: str

@api_router.post("/admin/events/{event_id}/notify-participant", dependencies=[Depends(require_admin)])
async def notify_event_participant(event_id: str, payload: NotifyParticipantPayload):
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "image_data": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email destinatario mancante")
    email_svc = EmailService()
    await email_svc.send_participant_notification(
        email=payload.email,
        name=payload.name,
        subject=payload.subject,
        body_text=payload.body_text,
        notification_type=payload.notification_type,
        event_title=event.get("title", ""),
    )
    return {"ok": True}

class BulkNotifyPayload(BaseModel):
    signup_ids: List[str]
    subject: str
    body_text: str
    notification_type: str

@api_router.post("/admin/events/{event_id}/notify-all", dependencies=[Depends(require_admin)])
async def bulk_notify_participants(event_id: str, payload: BulkNotifyPayload):
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "image_data": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    email_svc = EmailService()
    sent = 0
    errors = 0
    for signup_id in payload.signup_ids:
        signup = await db.event_signups.find_one({"id": signup_id}, {"_id": 0})
        if not signup:
            continue
        if signup.get("email"):
            try:
                await email_svc.send_participant_notification(
                    email=signup["email"], name=signup.get("name", ""),
                    subject=payload.subject, body_text=payload.body_text,
                    notification_type=payload.notification_type, event_title=event.get("title", ""),
                )
                sent += 1
            except Exception as e:
                logger.warning(f"Notifica non inviata a {signup.get('email')}: {e}")
                errors += 1
        for ospite in signup.get("ospiti", []):
            if ospite.get("email"):
                try:
                    await email_svc.send_participant_notification(
                        email=ospite["email"],
                        name=f"{ospite.get('nome', '')} {ospite.get('cognome', '')}".strip(),
                        subject=payload.subject, body_text=payload.body_text,
                        notification_type=payload.notification_type, event_title=event.get("title", ""),
                    )
                    sent += 1
                except Exception as e:
                    logger.warning(f"Notifica non inviata a ospite {ospite.get('email')}: {e}")
                    errors += 1
    return {"ok": True, "sent": sent, "errors": errors}

@api_router.post("/admin/event-signups/bulk-confirm", dependencies=[Depends(require_admin)])
async def bulk_confirm_signups(payload: BulkConfirmPayload):
    confirmed_count = 0
    for signup_id in payload.signup_ids:
        signup = await db.event_signups.find_one({"id": signup_id}, {"_id": 0})
        if not signup or signup.get("confirmed"):
            continue
        event = await db.events.find_one({"id": signup["event_id"]}, {"_id": 0})
        if not event:
            continue
        num_persone = signup.get("num_persone", 1)
        if event.get("spots", 0) < num_persone:
            continue
        await db.events.update_one({"id": signup["event_id"]}, {"$inc": {"spots": -num_persone}})
        await db.event_signups.update_one({"id": signup_id}, {"$set": {"confirmed": True}})
        try:
            email_svc = EmailService()
            await email_svc.send_event_confirmation(
                email=signup.get("email", ""),
                name=signup.get("name", ""),
                event_title=event.get("title", signup.get("event_title", "")),
                event_date=event.get("date", ""),
                event_time=event.get("time", ""),
                event_location=event.get("location", ""),
            )
        except Exception as e:
            logger.warning(f"Email conferma non inviata: {e}")
        confirmed_count += 1
    return {"ok": True, "confirmed": confirmed_count}

@api_router.patch("/admin/event-signups/{signup_id}/payment-status", dependencies=[Depends(require_admin)])
async def admin_update_event_signup_payment(signup_id: str, payload: PaymentStatusUpdate):
    res = await db.event_signups.update_one(
        {"id": signup_id},
        {"$set": {"payment_completed": payload.payment_completed}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    return {"ok": True}

# ========== ADMIN: EVENTS ==========
@api_router.get("/admin/events", dependencies=[Depends(require_admin)])
async def admin_get_events():
    docs = await db.events.find({}, {"_id": 0, "image_data": 0}).sort("date", 1).to_list(1000)
    return docs

@api_router.post("/admin/events/{event_id}/image", dependencies=[Depends(require_admin)])
async def admin_upload_event_image(event_id: str, payload: ImageUpload):
    res = await db.events.update_one(
        {"id": event_id},
        {"$set": {"image_data": payload.image_data, "has_image": True}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    return {"ok": True}

@api_router.delete("/admin/events/{event_id}/image", dependencies=[Depends(require_admin)])
async def admin_delete_event_image(event_id: str):
    res = await db.events.update_one(
        {"id": event_id},
        {"$set": {"has_image": False}, "$unset": {"image_data": ""}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    return {"ok": True}

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

# ========== BOOKS: PUBLIC ==========

@api_router.get("/books")
async def get_books():
    docs = await db.books.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.get("/books/{book_id}")
async def get_book(book_id: str):
    doc = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Libro non trovato")
    return doc

# ========== BOOK PROPOSALS: PUBLIC ==========

@api_router.get("/proposals")
async def get_proposals(month: Optional[str] = None):
    query = {"proposed_month": month} if month else {}
    docs = await db.proposals.find(query, {"_id": 0}).sort("votes", -1).to_list(1000)
    return docs

@api_router.post("/proposals")
async def create_proposal(payload: BookProposalCreate):
    if not payload.title.strip() or not payload.author.strip():
        raise HTTPException(status_code=400, detail="Titolo e autore sono obbligatori")
    month = payload.proposed_month or datetime.now(timezone.utc).strftime("%Y-%m")
    obj = BookProposal(
        title=payload.title.strip(),
        author=payload.author.strip(),
        cover_url=payload.cover_url or None,
        genre=payload.genre or None,
        description=payload.description or None,
        proposed_month=month,
        nome=payload.nome or None,
        cognome=payload.cognome or None,
        in_community_whatsapp=payload.in_community_whatsapp,
    )
    await db.proposals.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.post("/proposals/{proposal_id}/vote")
async def vote_proposal(proposal_id: str, voter: VoterCreate, force: bool = False):
    if voter.nome and voter.cognome and not force:
        proposal = await db.proposals.find_one({"id": proposal_id})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposta non trovata")
        nome_lower = voter.nome.strip().lower()
        cognome_lower = voter.cognome.strip().lower()
        existing = next(
            (v for v in proposal.get("voters", [])
             if v.get("nome", "").strip().lower() == nome_lower
             and v.get("cognome", "").strip().lower() == cognome_lower),
            None,
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"DUPLICATE:{existing.get('nome', '')} {existing.get('cognome', '')}",
            )
    voter_data = {k: v for k, v in voter.model_dump().items() if v is not None}
    update_op = {"$inc": {"votes": 1}}
    if voter_data:
        update_op["$push"] = {"voters": voter_data}
    doc = await db.proposals.find_one_and_update(
        {"id": proposal_id},
        update_op,
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    doc.pop("_id", None)
    return doc

@api_router.post("/proposals/{proposal_id}/unvote")
async def unvote_proposal(proposal_id: str, voter: VoterCreate):
    if not voter.nome or not voter.cognome:
        raise HTTPException(status_code=400, detail="Nome e cognome sono obbligatori per rimuovere il voto")
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    nome_lower = voter.nome.strip().lower()
    cognome_lower = voter.cognome.strip().lower()
    voters = proposal.get("voters", [])
    # find index of first matching voter (case-insensitive)
    idx = next(
        (i for i, v in enumerate(voters)
         if v.get("nome", "").strip().lower() == nome_lower
         and v.get("cognome", "").strip().lower() == cognome_lower),
        None,
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="Nessun voto trovato per questo nome")
    new_voters = [v for i, v in enumerate(voters) if i != idx]
    doc = await db.proposals.find_one_and_update(
        {"id": proposal_id},
        {"$set": {"voters": new_voters}, "$inc": {"votes": -1}},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    doc.pop("_id", None)
    return doc

@api_router.get("/admin/proposals", dependencies=[Depends(require_admin)])
async def admin_get_proposals():
    docs = await db.proposals.find({}, {"_id": 0}).sort("votes", -1).to_list(1000)
    return docs

@api_router.post("/admin/proposals/{proposal_id}/remove-anon-votes", dependencies=[Depends(require_admin)])
async def remove_anon_votes(proposal_id: str):
    proposal = await db.proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    named_voters = [v for v in proposal.get("voters", []) if v.get("nome") or v.get("cognome")]
    doc = await db.proposals.find_one_and_update(
        {"id": proposal_id},
        {"$set": {"voters": named_voters, "votes": len(named_voters)}},
        return_document=True,
    )
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/proposals/{proposal_id}", dependencies=[Depends(require_admin)])
async def admin_update_proposal(proposal_id: str, payload: dict):
    allowed = {"title", "author", "genre", "cover_url", "description", "proposed_month"}
    update = {k: v for k, v in payload.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Niente da aggiornare")
    res = await db.proposals.update_one({"id": proposal_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    return await db.proposals.find_one({"id": proposal_id}, {"_id": 0})

@api_router.delete("/admin/proposals/{proposal_id}", dependencies=[Depends(require_admin)])
async def admin_delete_proposal(proposal_id: str):
    res = await db.proposals.delete_one({"id": proposal_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    return {"ok": True}

# ========== REVIEWS: PUBLIC ==========

@api_router.get("/reviews")
async def get_reviews():
    docs = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.post("/books/{book_id}/reviews")
async def submit_review(book_id: str, payload: ReviewCreate):
    if not payload.reviewer_name.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Nome e testo sono obbligatori")
    book = await db.books.find_one({"id": book_id}, {"_id": 0})
    if not book:
        raise HTTPException(status_code=404, detail="Libro non trovato")
    review = Review(
        book_id=book_id,
        book_title=book.get("title", ""),
        reviewer_name=payload.reviewer_name.strip(),
        content=payload.content.strip(),
        rating=payload.rating,
    )
    await db.reviews.insert_one(review.model_dump())
    return review.model_dump()

# ========== ADMIN: REVIEWS ==========

@api_router.get("/admin/reviews", dependencies=[Depends(require_admin)])
async def admin_get_reviews():
    docs = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.delete("/admin/reviews/{review_id}", dependencies=[Depends(require_admin)])
async def admin_delete_review(review_id: str):
    res = await db.reviews.delete_one({"id": review_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recensione non trovata")
    return {"ok": True}

# ========== ADMIN: BOOKS ==========

@api_router.post("/admin/books", dependencies=[Depends(require_admin)])
async def admin_create_book(payload: BookCreate):
    obj = Book(**payload.model_dump())
    await db.books.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.put("/admin/books/{book_id}", dependencies=[Depends(require_admin)])
async def admin_update_book(book_id: str, payload: BookUpdate):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="Niente da aggiornare")
    res = await db.books.update_one({"id": book_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Libro non trovato")
    return await db.books.find_one({"id": book_id}, {"_id": 0})

@api_router.delete("/admin/books/{book_id}", dependencies=[Depends(require_admin)])
async def admin_delete_book(book_id: str):
    res = await db.books.delete_one({"id": book_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Libro non trovato")
    return {"ok": True}

# ========== FILMS: PUBLIC ==========

@api_router.get("/films")
async def get_films():
    docs = await db.films.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.get("/films/{film_id}")
async def get_film(film_id: str):
    doc = await db.films.find_one({"id": film_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Film non trovato")
    return doc

# ========== FILM PROPOSALS: PUBLIC ==========

@api_router.get("/film-proposals")
async def get_film_proposals(month: Optional[str] = None):
    query = {"proposed_month": month} if month else {}
    docs = await db.film_proposals.find(query, {"_id": 0}).sort("votes", -1).to_list(1000)
    return docs

@api_router.post("/film-proposals")
async def create_film_proposal(payload: FilmProposalCreate):
    if not payload.title.strip() or not payload.director.strip():
        raise HTTPException(status_code=400, detail="Titolo e regista sono obbligatori")
    month = payload.proposed_month or datetime.now(timezone.utc).strftime("%Y-%m")
    obj = FilmProposal(
        title=payload.title.strip(),
        director=payload.director.strip(),
        cover_url=payload.cover_url or None,
        genre=payload.genre or None,
        description=payload.description or None,
        trailer_url=payload.trailer_url or None,
        discussion_topics=payload.discussion_topics or None,
        external_reviews=payload.external_reviews or [],
        proposed_month=month,
        nome=payload.nome or None,
        cognome=payload.cognome or None,
        in_community_whatsapp=payload.in_community_whatsapp,
    )
    await db.film_proposals.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.post("/film-proposals/{proposal_id}/vote")
async def vote_film_proposal(proposal_id: str, voter: VoterCreate, force: bool = False):
    if voter.nome and voter.cognome and not force:
        proposal = await db.film_proposals.find_one({"id": proposal_id})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposta non trovata")
        nome_lower = voter.nome.strip().lower()
        cognome_lower = voter.cognome.strip().lower()
        existing = next(
            (v for v in proposal.get("voters", [])
             if v.get("nome", "").strip().lower() == nome_lower
             and v.get("cognome", "").strip().lower() == cognome_lower),
            None,
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"DUPLICATE:{existing.get('nome', '')} {existing.get('cognome', '')}",
            )
    voter_data = {k: v for k, v in voter.model_dump().items() if v is not None}
    update_op = {"$inc": {"votes": 1}}
    if voter_data:
        update_op["$push"] = {"voters": voter_data}
    doc = await db.film_proposals.find_one_and_update(
        {"id": proposal_id},
        update_op,
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    doc.pop("_id", None)
    return doc

@api_router.post("/film-proposals/{proposal_id}/unvote")
async def unvote_film_proposal(proposal_id: str, voter: VoterCreate):
    if not voter.nome or not voter.cognome:
        raise HTTPException(status_code=400, detail="Nome e cognome sono obbligatori per rimuovere il voto")
    proposal = await db.film_proposals.find_one({"id": proposal_id})
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    nome_lower = voter.nome.strip().lower()
    cognome_lower = voter.cognome.strip().lower()
    voters = proposal.get("voters", [])
    idx = next(
        (i for i, v in enumerate(voters)
         if v.get("nome", "").strip().lower() == nome_lower
         and v.get("cognome", "").strip().lower() == cognome_lower),
        None,
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="Nessun voto trovato per questo nome")
    new_voters = [v for i, v in enumerate(voters) if i != idx]
    doc = await db.film_proposals.find_one_and_update(
        {"id": proposal_id},
        {"$set": {"voters": new_voters}, "$inc": {"votes": -1}},
        return_document=True,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    doc.pop("_id", None)
    return doc

# ========== FILM REVIEWS: PUBLIC ==========

@api_router.get("/film-reviews")
async def get_film_reviews():
    docs = await db.film_reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.post("/films/{film_id}/film-reviews")
async def submit_film_review(film_id: str, payload: FilmReviewCreate):
    if not payload.reviewer_name.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Nome e testo sono obbligatori")
    film = await db.films.find_one({"id": film_id}, {"_id": 0})
    if not film:
        raise HTTPException(status_code=404, detail="Film non trovato")
    review = FilmReview(
        film_id=film_id,
        film_title=film.get("title", ""),
        reviewer_name=payload.reviewer_name.strip(),
        content=payload.content.strip(),
        rating=payload.rating,
    )
    await db.film_reviews.insert_one(review.model_dump())
    return review.model_dump()

# ========== ADMIN: FILM PROPOSALS ==========

@api_router.get("/admin/film-proposals", dependencies=[Depends(require_admin)])
async def admin_get_film_proposals():
    docs = await db.film_proposals.find({}, {"_id": 0}).sort("votes", -1).to_list(1000)
    return docs

@api_router.put("/admin/film-proposals/{proposal_id}", dependencies=[Depends(require_admin)])
async def admin_update_film_proposal(proposal_id: str, payload: dict):
    allowed = {"title", "director", "genre", "cover_url", "description", "trailer_url", "discussion_topics", "external_reviews", "proposed_month"}
    update = {k: v for k, v in payload.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Niente da aggiornare")
    res = await db.film_proposals.update_one({"id": proposal_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    return await db.film_proposals.find_one({"id": proposal_id}, {"_id": 0})

@api_router.delete("/admin/film-proposals/{proposal_id}", dependencies=[Depends(require_admin)])
async def admin_delete_film_proposal(proposal_id: str):
    res = await db.film_proposals.delete_one({"id": proposal_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proposta non trovata")
    return {"ok": True}

# ========== ADMIN: FILM REVIEWS ==========

@api_router.get("/admin/film-reviews", dependencies=[Depends(require_admin)])
async def admin_get_film_reviews():
    docs = await db.film_reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.delete("/admin/film-reviews/{review_id}", dependencies=[Depends(require_admin)])
async def admin_delete_film_review(review_id: str):
    res = await db.film_reviews.delete_one({"id": review_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recensione non trovata")
    return {"ok": True}

# ========== ADMIN: FILMS ==========

@api_router.post("/admin/films", dependencies=[Depends(require_admin)])
async def admin_create_film(payload: FilmCreate):
    obj = Film(**payload.model_dump())
    await db.films.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.put("/admin/films/{film_id}", dependencies=[Depends(require_admin)])
async def admin_update_film(film_id: str, payload: FilmUpdate):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="Niente da aggiornare")
    res = await db.films.update_one({"id": film_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Film non trovato")
    return await db.films.find_one({"id": film_id}, {"_id": 0})

@api_router.delete("/admin/films/{film_id}", dependencies=[Depends(require_admin)])
async def admin_delete_film(film_id: str):
    res = await db.films.delete_one({"id": film_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Film non trovato")
    return {"ok": True}

app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.tramavivaaps.com", "https://tramavivaaps.com"],
    allow_credentials=False,
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
                doc.setdefault("featured", False)
                doc.setdefault("contributo", 0.0)
                seeded.append(doc)
            if seeded:
                await db.events.insert_many(seeded)
                logger.info(f"Seeded {len(seeded)} events")
    except Exception as ex:
        logger.error(f"Event seed failed: {ex}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
