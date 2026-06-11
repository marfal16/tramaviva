# Guida Implementazione Iscrizione Espansa con PDF

## 📋 Sommario

Questa guida descrive l'implementazione completa del nuovo flusso di **iscrizione espansa** per Trama Viva APS, che integra:

- ✅ Form esteso per raccogliere dati dettagliati
- ✅ Compilazione automatica di un PDF con i dati inseriti
- ✅ Consensi e dichiarazioni obbligatorie tramite modal
- ✅ Integrazione con pagamento SumUp
- ✅ Email di conferma automatiche
- ✅ Sezione Admin per scaricare e gestire i documenti
- ✅ Cancellazione sicura dei dati sensibili

---

## 🗂️ Struttura dei File

### Frontend
```
frontend/src/components/
├── IscrizioneExpanded.jsx      # Nuovo form esteso (sostituisce Iscrizione.jsx)
├── ConsentModal.jsx             # Modal con condizioni di iscrizione
└── Iscrizione.jsx               # (Vecchio) - Può essere rimosso
```

### Backend
```
backend/
├── server.py                    # Server principale FastAPI (aggiornato)
├── models.py                    # Modelli Pydantic per Registration
├── pdf_service.py               # Generazione PDF con ReportLab
├── email_service.py             # Invio email di conferma
├── registration_routes.py       # Endpoints registrazioni (opzionale)
└── requirements.txt             # Dipendenze Python
```

---

## 🚀 Procedura di Integrazione

### Step 1: Aggiornare le Dipendenze Frontend

```bash
cd frontend
npm install
```

I nuovi componenti usano le dipendenze già installate (lucide-react, axios, sonner).

### Step 2: Aggiornare le Dipendenze Backend

```bash
cd backend
pip install -r requirements.txt
```

Dipendenze principali aggiunte:
- **reportlab**: Per la generazione PDF
- **aiosmtplib**: Per l'invio email asincrono
- **email-validator**: Validazione indirizzi email

### Step 3: Configurare le Variabili d'Ambiente

Aggiungi al tuo `.env` file:

```env
# Database MongoDB
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net
DB_NAME=tramaviva

# SumUp Payment
SUMUP_API_KEY=your_sumup_api_key
SUMUP_MERCHANT_CODE=your_merchant_code

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password  # Usa App Password, non la password principale
FROM_EMAIL=noreply@tramavivaaps.it
FROM_NAME=Trama Viva APS

# Admin
ADMIN_TOKEN=your_secure_admin_token

# CORS
CORS_ORIGINS=http://localhost:3000,https://tramaviva.vercel.app
```

### Step 4: Aggiornare il Componente Iscrizione nel Frontend

Sostituisci l'import in `App.js`:

```javascript
// Prima
import Iscrizione from "./components/Iscrizione";

// Dopo
import { IscrizioneExpanded as Iscrizione } from "./components/IscrizioneExpanded";
```

### Step 5: Avviare il Server Backend

```bash
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Avviare il Frontend

```bash
cd frontend
npm start
```

Il sito sarà disponibile su `http://localhost:3000`.

---

## 📝 Flusso di Iscrizione Utente

```
1. Utente visita "Diventa socio"
   ↓
2. Compila i campi (form espanso con sezioni collapsibili)
   - Dati personali
   - Dati anagrafici
   - Documento d'identità
   - Residenza e contatti
   - Informazioni minori (se applicabile)
   - Consensi
   - Dichiarazione
   ↓
3. Spunta "Ho letto e accetto le condizioni"
   ↓
4. Appare Modal con le condizioni
   ↓
5. Accetta o Rifiuta
   ↓
6. Se accettato, clicca "Procedi al Pagamento"
   ↓
7. Backend:
   a. Salva dati su MongoDB
   b. Genera PDF compilato con i dati
   c. Memorizza PDF in base64
   d. Crea checkout SumUp
   ↓
8. Utente reindirizzato a SumUp per pagamento
   ↓
9. Dopo pagamento:
   a. SumUp notifica il backend
   b. Stato cambio a "completed"
   c. Email di conferma inviata all'utente
```

---

## 🔐 Flusso Admin: Scaricamento e Pulizia Dati

```
1. Admin accede a /admin
   ↓
2. Tab "Richieste iscrizione"
   ↓
3. Vede lista di registrazioni
   ↓
4. Clicca "Scarica documento"
   ↓
5. Backend:
   a. Recupera PDF in base64
   b. Marca come "document_downloaded"
   c. Ritorna PDF al client
   ↓
6. File scaricato in locale (es: iscrizione_Mario_Rossi_abc12345.pdf)
   ↓
7. Admin firma il documento cartaceo
   ↓
8. Admin clicca "Elimina dati sensibili"
   ↓
9. Backend:
   a. Verifica che il PDF sia stato scaricato
   b. Cancella i dati temporanei dal DB:
      ✗ data_nascita
      ✗ codice_fiscale
      ✗ documento_*
      ✗ indirizzo
      ✗ comune, provincia, cap
      ✗ cellulare (opzionale, puoi mantenerlo)
      ✗ pdf_base64
   c. Conserva solo:
      ✓ first_name
      ✓ last_name
      ✓ email
      ✓ phone
      ✓ referral
      ✓ status = "archived"
      ✓ created_at
   ↓
10. Dati sensibili eliminati, documento conservato offline
```

---

## 📊 Struttura Database MongoDB

### Collection: `registrations`

```javascript
{
  "id": "uuid",
  "first_name": "Mario",
  "last_name": "Rossi",
  "email": "mario@example.com",
  "phone": "+39123456789",
  "referral": "Un amico",
  
  // Dati anagrafici (eliminabili)
  "data_nascita": "1985-05-15",
  "luogo_nascita": "Milano",
  "codice_fiscale": "RSSMRA85M01H501U",
  "cittadinanza": "Italiana",
  
  // Documento (eliminabile)
  "documento_tipo": "Carta ID",
  "documento_numero": "AB12345",
  "documento_rilasciato": "Comune di Milano",
  "documento_data": "2020-01-15",
  
  // Residenza (eliminabile)
  "indirizzo": "Via Roma 123",
  "comune": "Milano",
  "provincia": "MI",
  "cap": "20100",
  "cellulare": "+39123456789",
  
  // Minori (eliminabile)
  "is_minorenne": false,
  "genitore_nome": null,
  "genitore_cognome": null,
  
  // Consensi
  "consenso_comunicazioni": true,
  "consenso_pubblico": true,
  "consenso_privacy": true,
  "consenso_dati": true,
  
  // PDF (eliminabile)
  "pdf_base64": "JVBERi0xLjQKJeLj...",
  
  // Metadata
  "status": "completed",  // pending, completed, archived
  "payment_completed": true,
  "payment_completed_at": "2026-06-11T10:30:00Z",
  "document_downloaded": true,
  "document_downloaded_at": "2026-06-11T10:35:00Z",
  "created_at": "2026-06-11T10:00:00Z"
}
```

---

## 📡 Endpoints API

### Public Endpoints

#### `POST /api/registrations/create`
Crea una nuova registrazione e genera il PDF.

**Payload:**
```json
{
  "first_name": "Mario",
  "last_name": "Rossi",
  "email": "mario@example.com",
  "phone": "+39123456789",
  "data_nascita": "1985-05-15",
  "codice_fiscale": "RSSMRA85M01H501U",
  "indirizzo": "Via Roma 123",
  "comune": "Milano",
  "cap": "20100",
  "cellulare": "+39123456789",
  "consenso_comunicazioni": true,
  "consenso_pubblico": true,
  "consenso_privacy": true,
  "consenso_dati": true,
  "dichiarazione_accettata": true
}
```

**Response:**
```json
{
  "registration_id": "uuid-1234",
  "status": "pending",
  "message": "Iscrizione salvata. Procedi al pagamento."
}
```

#### `POST /api/registrations/{registration_id}/payment-completed`
Marca il pagamento come completato e invia email.

---

### Admin Endpoints (Require Bearer Token)

#### `GET /api/admin/registrations`
Lista tutte le registrazioni (senza PDF base64).

#### `GET /api/admin/registrations/{registration_id}/pdf`
Scarica il PDF compilato e lo marca come scaricato.

**Response:**
```json
{
  "pdf_base64": "JVBERi0xLjQKJeLj...",
  "filename": "iscrizione_Mario_Rossi_uuid1234.pdf"
}
```

#### `POST /api/admin/registrations/{registration_id}/cleanup`
Elimina i dati sensibili, mantiene solo essenziali.

**Precondizione:** `document_downloaded` must be `true`.

---

## 🎨 Personalizzazione Design

Il componente `IscrizioneExpanded` usa le variabili Tailwind CSS di Trama Viva:

```javascript
// Colori disponibili
colors: {
  'green': '#A7B94C',
  'green-deep': '#2D3A18',
  'cream': '#F9ECD4',
  'sky': '#8FC2E5',
  'mint': '#92C8B9',
  'bordeaux': '#5D1723',
  'orange': '#F99C2C',
}
```

Per cambiare lo stile, modifica le classi Tailwind direttamente nel componente.

---

## 🔧 Troubleshooting

### Errore: "PDF non generato"
**Causa:** ReportLab non installato.
**Soluzione:** `pip install reportlab`

### Errore: "Email non inviata"
**Causa:** SMTP non configurato o credenziali errate.
**Soluzione:** 
- Usa Google App Passwords, non la password normale
- Verifica SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- Se non vuoi email, il sistema ignora silenziosamente l'errore

### Errore: "Pagamento non riconosciuto"
**Causa:** Il backend non ha ricevuto il callback da SumUp.
**Soluzione:** 
- Configura Webhook in SumUp Dashboard
- Assicurati che il backend sia raggiungibile da SumUp
- Usa Vercel o Ngrok per testare in locale

### PDF troppo grande
**Causa:** ReportLab genera file grandi.
**Soluzione:** 
- Usa compressione in browser prima di salvare
- O spostati su un servizio esterno per i PDF

---

## 📚 Documentazione Esterna

- [ReportLab Docs](https://www.reportlab.com/docs/reportlab-userguide.pdf)
- [aiosmtplib](https://github.com/cole/aiosmtplib)
- [SumUp API](https://docs.sumup.com/)
- [Pydantic Models](https://docs.pydantic.dev/)

---

## 🎯 Roadmap Futura

- [ ] Integrazione firma digitale (DocuSign / SignNow)
- [ ] Template PDF personalizzabili
- [ ] Multi-lingua supporto
- [ ] Backup automatico su cloud storage (S3 / Google Cloud)
- [ ] Dashboard statistiche iscrizioni
- [ ] Export automati dati aggregati

---

## ✅ Checklist di Deployment

- [ ] Variabili d'ambiente configurate
- [ ] Database MongoDB online
- [ ] SumUp API keys valide
- [ ] SMTP configurato (o service esterno)
- [ ] Frontend buildato: `npm run build`
- [ ] Backend deployed su Vercel / Heroku
- [ ] CORS origin corretto
- [ ] SSL/HTTPS attivato
- [ ] Admin token sicuro
- [ ] Webhook SumUp configurato
- [ ] Email di test inviata con successo

---

**Versione:** 1.0.0  
**Data:** 11 Giugno 2026  
**Autore:** Trama Viva APS Team
