from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

# ========== REGISTRATION MODELS ==========

class RegistrationCreate(BaseModel):
    """Form dati di iscrizione espansa"""
    # Dati personali base
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    referral: Optional[str] = None
    
    # Dati anagrafici
    luogo_nascita: Optional[str] = None
    data_nascita: str
    codice_fiscale: str
    cittadinanza: Optional[str] = None
    
    # Documento d'identità
    documento_tipo: str
    documento_numero: Optional[str] = None
    documento_rilasciato: Optional[str] = None
    documento_data: Optional[str] = None
    
    # Residenza e contatti
    indirizzo: str
    comune: str
    provincia: Optional[str] = None
    cap: str
    cellulare: str
    
    # Minori
    is_minorenne: bool = False
    genitore_nome: Optional[str] = None
    genitore_cognome: Optional[str] = None
    genitore_telefono: Optional[str] = None
    genitore_documento_tipo: Optional[str] = None
    genitore_documento_numero: Optional[str] = None
    
    # Consensi
    consenso_comunicazioni: bool
    consenso_pubblico: bool
    consenso_privacy: bool
    consenso_dati: bool
    
    # Dichiarazione
    dichiarazione_accettata: bool


class Registration(BaseModel):
    """Registrazione nel database"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Dati base (manteniamo sempre)
    first_name: str
    last_name: str
    email: str
    phone: str
    referral: Optional[str] = None
    
    # Dati completi (eliminabili dopo download admin)
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
    
    # Minori
    is_minorenne: bool = False
    genitore_nome: Optional[str] = None
    genitore_cognome: Optional[str] = None
    genitore_telefono: Optional[str] = None
    genitore_documento_tipo: Optional[str] = None
    genitore_documento_numero: Optional[str] = None
    
    # Consensi
    consenso_comunicazioni: bool
    consenso_pubblico: bool
    consenso_privacy: bool
    consenso_dati: bool
    
    # PDF compilato in base64
    pdf_base64: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"  # pending, completed, cancelled
    payment_completed: bool = False
    document_downloaded: bool = False


# ========== EXISTING MODELS (Keep compatibility) ==========

class EventSignupCreate(BaseModel):
    event_id: str
    event_title: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: Optional[str] = None
    referral: Optional[str] = None


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
