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


class EventCreate(BaseModel):
    title: str
    category: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    location: str
    description: str
    emoji: str = "✨"
    spots: int = 20
    slug: Optional[str] = None
    featured: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    spots: Optional[int] = None
    slug: Optional[str] = None
    featured: Optional[bool] = None


def make_slug(title: str) -> str:
    import re, unicodedata
    s = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s).strip().lower()
    s = re.sub(r"\s+", "-", s)
    return s[:80] or "evento"


# ---------- Members (tesserati registry) ----------
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
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    tessera_number: Optional[str] = None
    notes: Optional[str] = None


# ---------- Seeded events ----------
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


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Trama Viva APS API", "tagline": "Ogni filo conta"}


@api_router.get("/events", response_model=List[Event])
async def get_events():
    docs = await db.events.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    return docs


@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    # Allow lookup by id or slug
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    return doc


@api_router.get("/events/{event_id}/signups-count")
async def get_event_signups_count(event_id: str):
    """Public endpoint: returns just the count of signup requests for an event (privacy-safe)."""
    doc = await db.events.find_one({"$or": [{"id": event_id}, {"slug": event_id}]}, {"id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Evento non trovato")
    count = await db.event_signups.count_documents({"event_id": doc["id"]})
    return {"count": count}


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
    member_emails = await _get_member_emails()
    for d in docs:
        d["is_member"] = (d.get("email") or "").lower() in member_emails
    return docs


@api_router.get("/admin/memberships", dependencies=[Depends(require_admin)])
async def admin_memberships():
    docs = await db.memberships.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    member_emails = await _get_member_emails()
    for d in docs:
        d["is_member"] = (d.get("email") or "").lower() in member_emails
    return docs


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
    }
    if collection not in allowed:
        raise HTTPException(status_code=400, detail="Collezione non valida")
    res = await db[allowed[collection]].delete_one({"id": doc_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Documento non trovato")
    return {"ok": True}


# ---------- Admin: Members (tesserati registry) ----------
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
    """Promote a membership request to a tesserato member."""
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
    """Conferma presenza socio tesserato e scala un posto dall'evento."""
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


# ---------- Admin: Events CRUD ----------
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_events_on_startup():
    """If the events collection is empty, seed it with the default events."""
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
