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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Trama Viva APS")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class EventSignupCreate(BaseModel):
    event_id: str
    event_title: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None


class EventSignup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    event_title: str
    name: str
    email: str
    phone: Optional[str] = None
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MembershipCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    city: Optional[str] = None
    birthdate: Optional[str] = None
    motivation: Optional[str] = None


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
    title: str
    category: str
    date: str
    time: str
    location: str
    description: str
    emoji: str
    spots: int


# ---------- Seeded events ----------
EVENTS: List[dict] = [
    {
        "id": "evt-aperi-01",
        "title": "Aperitivo di Benvenuto",
        "category": "Aperitivi Sociali",
        "date": "2026-01-17",
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
        "date": "2026-01-25",
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
        "date": "2026-02-08",
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
        "date": "2026-02-15",
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
        "date": "2026-02-28",
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
        "date": "2026-03-14",
        "time": "15:00",
        "location": "Quartiere Isola",
        "description": "Muri che parlano, persone che ascoltano. 3 ore di murales e meraviglia.",
        "emoji": "🎨",
        "spots": 20,
    },
]


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Trama Viva APS API", "tagline": "Ogni filo conta"}


@api_router.get("/events", response_model=List[Event])
async def get_events():
    return EVENTS


@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    for e in EVENTS:
        if e["id"] == event_id:
            return e
    raise HTTPException(status_code=404, detail="Evento non trovato")


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


# ---------- Admin (token-protected) ----------
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


@api_router.get("/admin/event-signups", dependencies=[Depends(require_admin)])
async def admin_event_signups():
    docs = await db.event_signups.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.get("/admin/memberships", dependencies=[Depends(require_admin)])
async def admin_memberships():
    docs = await db.memberships.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.get("/admin/contacts", dependencies=[Depends(require_admin)])
async def admin_contacts():
    docs = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.delete("/admin/{collection}/{doc_id}", dependencies=[Depends(require_admin)])
async def admin_delete(collection: str, doc_id: str):
    allowed = {"event-signups": "event_signups", "memberships": "memberships", "contacts": "contacts"}
    if collection not in allowed:
        raise HTTPException(status_code=400, detail="Collezione non valida")
    res = await db[allowed[collection]].delete_one({"id": doc_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Documento non trovato")
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
