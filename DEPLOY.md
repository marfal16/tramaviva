# Deploy completo — APS Trama Viva
**Frontend (React) + Backend (FastAPI Serverless) + MongoDB Atlas**
**Tutto su Vercel + Atlas. Costo: 0 €. Niente carta di credito.**

---

## Struttura del progetto

Dopo la nostra riorganizzazione:

```
tramaviva-website/                  ← repo GitHub
├── backend/
│   ├── api/
│   │   └── index.py               ← entry point Vercel (NUOVO)
│   ├── server.py                  ← FastAPI app (invariato)
│   ├── vercel.json                ← config Vercel (NUOVO)
│   ├── requirements.txt           ← dipendenze Python (da rinominare per deploy)
│   └── requirements-vercel.txt    ← versione lean per Vercel (NUOVO)
└── frontend/
    ├── vercel.json                ← config SPA routing (NUOVO)
    ├── package.json
    └── src/
```

---

## STEP 1 — MongoDB Atlas (database in cloud)

### 1.1 Registrazione
1. Vai su <https://cloud.mongodb.com> → **Try Free**.
2. Registrati con Google o email. **Nessuna carta richiesta.**

### 1.2 Crea il cluster gratuito
1. Dopo il login, click **"Build a Database"**.
2. Scegli **M0 — Free Forever** (512 MB, sempre attivo).
3. **Provider**: AWS · **Region**: Frankfurt (eu-central-1) — più vicina all'Italia.
4. **Cluster Name**: `tramaviva-cluster` (o quello che preferisci).
5. Click **Create Deployment**. Aspetta 2-3 minuti.

### 1.3 Crea l'utente database
1. Mentre crea il cluster, ti chiederà di creare un utente:
   - **Username**: `tramaviva-admin`
   - **Password**: clicca "Autogenerate Secure Password" e **COPIA LA PASSWORD** in un posto sicuro (non potrai più vederla).
2. Click **Create Database User**.

### 1.4 Configura accesso di rete
1. Sezione "Where would you like to connect from?" → seleziona **"My Local Environment"**.
2. Click **"Add My Current IP Address"**.
3. **IMPORTANTE**: dopo questo passaggio, vai nel menu laterale → **Network Access** → **Add IP Address** → seleziona **"Allow Access from Anywhere"** (`0.0.0.0/0`). Questo serve perché Vercel usa IP variabili.
4. Conferma con **Confirm**.

### 1.5 Ottieni la connection string
1. Menu laterale → **Database** → click **"Connect"** sul cluster.
2. Scegli **"Drivers"**.
3. **Driver**: Python · **Version**: 3.6 or later.
4. Copia la stringa che inizia con `mongodb+srv://...`. Sarà tipo:
   ```
   mongodb+srv://tramaviva-admin:<password>@tramaviva-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **SOSTITUISCI** `<password>` con la password reale che hai copiato al punto 1.3.
6. Salvati questa stringa: la chiameremo `MONGO_URL`.

---

## STEP 2 — Push su GitHub

Se non l'hai già fatto:

### 2.1 Salva su GitHub da Emergent
1. Nel pannello Emergent, in alto, click sul bottone **"Save to GitHub"** (o "Push to GitHub").
2. Connetti il tuo account GitHub se richiesto.
3. Crea un nuovo repo con nome **`tramaviva-website`**. Visibilità: privata o pubblica come preferisci.
4. Conferma.

### 2.2 Prepara i file per Vercel
Ora servono **due piccole azioni manuali sul tuo computer locale** (oppure direttamente su GitHub via web).

Apri il repo `tramaviva-website` in Visual Studio Code (o sul sito di GitHub direttamente):

**Azione 1 — sostituisci `backend/requirements.txt` con la versione lean**

Su GitHub web:
1. Vai a `backend/requirements.txt` → click sull'icona matita (Edit) → **rinomina** il file in `requirements-dev.txt` → commit.
2. Vai a `backend/requirements-vercel.txt` → click matita → **rinomina** in `requirements.txt` → commit.

Da terminale (alternativa):
```bash
cd tramaviva-website/backend
git mv requirements.txt requirements-dev.txt
git mv requirements-vercel.txt requirements.txt
git commit -m "Use minimal deps for Vercel deploy"
git push
```

> **Perché?** Vercel ha un limite di 250 MB per la funzione serverless. Le librerie pesanti che usa Emergent (pandas, numpy, boto3) supererebbero il limite. Il file `requirements-vercel.txt` contiene solo lo stretto necessario per FastAPI + MongoDB.

---

## STEP 3 — Deploy del Backend su Vercel

### 3.1 Crea il progetto Backend
1. Vai su <https://vercel.com> → **Sign Up** con GitHub. Nessuna carta richiesta.
2. Dashboard → **Add New** → **Project**.
3. Trova `tramaviva-website` nella lista → **Import**.
4. **Configura il progetto**:
   - **Project Name**: `tramaviva-api`
   - **Framework Preset**: lascia "Other"
   - **Root Directory**: click **"Edit"** → seleziona la cartella **`backend`** → Continue
   - **Build/Output Settings**: lascia tutto vuoto/default
5. **Environment Variables** (clicca "Environment Variables" per aprirla):
   | Nome | Valore |
   |---|---|
   | `MONGO_URL` | la stringa `mongodb+srv://...` da Step 1.5 |
   | `DB_NAME` | `tramaviva` |
   | `ADMIN_TOKEN` | una password forte (es. `tramaviva-admin-2026!`) |
   | `CORS_ORIGINS` | per ora `*` — lo aggiorniamo dopo |
6. Click **Deploy**. Attendi 2-3 minuti.

### 3.2 Verifica il backend
1. Vercel ti mostrerà un URL tipo `https://tramaviva-api.vercel.app`.
2. Apri in una nuova tab: `https://tramaviva-api.vercel.app/api/`
3. Dovresti vedere: `{"message":"Trama Viva APS API","tagline":"Ogni filo conta"}`
4. Prova anche: `https://tramaviva-api.vercel.app/api/events` → dovrebbe restituire `[]` (DB vuoto).
5. **Salvati questo URL**: lo useremo per il frontend.

### 3.3 (Opzionale) Seed iniziale degli eventi
Visto che il DB è vuoto, gli eventi seed verranno aggiunti automaticamente alla prima richiesta a `/api/events` (il backend ha logica di seed automatico). Se preferisci puoi anche aggiungerli manualmente dopo dal pannello admin.

---

## STEP 4 — Deploy del Frontend su Vercel

### 4.1 Crea il progetto Frontend
1. Dashboard Vercel → **Add New** → **Project**.
2. Trova **lo stesso repo** `tramaviva-website` → **Import** (Vercel ti permette progetti multipli sullo stesso repo).
3. **Configura**:
   - **Project Name**: `tramaviva` (o `tramavivaaps`)
   - **Framework Preset**: Vercel rileverà **Create React App** automaticamente
   - **Root Directory**: click **"Edit"** → seleziona **`frontend`** → Continue
   - **Build Command**: lascia default (`yarn build` o `npm run build`)
   - **Output Directory**: lascia default (`build`)
4. **Environment Variables**:
   | Nome | Valore |
   |---|---|
   | `REACT_APP_BACKEND_URL` | l'URL del backend, es. `https://tramaviva-api.vercel.app` |
5. Click **Deploy**. Attendi ~3 minuti per la prima build.

### 4.2 Aggiorna il CORS del backend
Ora che hai l'URL del frontend (es. `https://tramaviva.vercel.app`), torna sul progetto **`tramaviva-api`**:
1. Vercel → progetto `tramaviva-api` → **Settings** → **Environment Variables**.
2. Modifica `CORS_ORIGINS` da `*` a:
   ```
   https://tramaviva.vercel.app
   ```
3. Save.
4. Vai sulla tab **Deployments** → click "Redeploy" sull'ultimo deploy → conferma.

### 4.3 Test end-to-end
1. Apri `https://tramaviva.vercel.app` (URL del frontend).
2. Naviga sezione Eventi → vedrai i 6 eventi seed (verranno creati alla prima call).
3. Vai su `/admin` → login con la password che hai messo in `ADMIN_TOKEN`.
4. Compila il form Iscrizione e verifica che arrivi nell'admin.

---

## STEP 5 — Dominio personalizzato (opzionale)

Quando avrai comprato `tramaviva.it` (Aruba/OVH/Namecheap, ~10 €/anno):

### 5.1 Aggancia dominio al frontend
1. Vercel → progetto `tramaviva` → **Settings** → **Domains**.
2. **Add** → inserisci `tramaviva.it` (e/o `www.tramaviva.it`).
3. Vercel ti mostrerà 1-2 record DNS da configurare:
   - **Tipo A**: `tramaviva.it` → `76.76.21.21`
   - **Tipo CNAME**: `www.tramaviva.it` → `cname.vercel-dns.com`
4. Vai sul pannello del registrar dove hai comprato il dominio → DNS Settings → aggiungi i record.
5. Aspetta propagazione (1-24h). SSL/HTTPS automatico via Let's Encrypt.

### 5.2 Aggiorna CORS dopo dominio custom
Quando il dominio funziona, aggiorna `CORS_ORIGINS` del backend includendo entrambi:
```
https://tramaviva.vercel.app,https://tramaviva.it,https://www.tramaviva.it
```
Redeploy backend.

### 5.3 (Suggerito) Sottodominio API
Per pulizia, puoi puntare anche `api.tramaviva.it` al backend:
1. Sul progetto `tramaviva-api` → Settings → Domains → Add → `api.tramaviva.it`.
2. Aggiungi record DNS sul registrar:
   - **CNAME**: `api.tramaviva.it` → `cname.vercel-dns.com`
3. Aggiorna `REACT_APP_BACKEND_URL` del frontend in `https://api.tramaviva.it` → redeploy frontend.

---

## STEP 6 — Continuous Deploy

Da ora in poi, ogni `git push` su GitHub farà partire automaticamente:
- Build + deploy del frontend in ~2 min
- Build + deploy del backend in ~1 min

Vercel ti manderà email di conferma. Se qualcosa fallisce, lo vedi nel dashboard nella tab "Deployments" con i log dettagliati.

---

## Risoluzione problemi comuni

### Il backend dà 500 Internal Server Error
- Vercel → progetto `tramaviva-api` → **Functions** o **Deployments** → vedi log.
- Causa più frequente: `MONGO_URL` errata. Controlla password e network access su Atlas.

### Cold start lento
- La prima richiesta dopo ~10 min di inattività ha cold start ~500-1500 ms (FastAPI + Mongo init).
- Le successive sono istantanee.
- Per APS vetrina è impercettibile.

### MongoDB connection refused
- Atlas → Network Access → assicurati di avere `0.0.0.0/0` aperto.

### CORS error nel browser
- Backend `CORS_ORIGINS` non include il dominio del frontend.
- Aggiorna env var e fai redeploy del backend.

### "Module not found" su Vercel build
- Verifica che `requirements.txt` sia stato rinominato come spiegato nello Step 2.2.
- Se hai aggiunto librerie nuove, includi anche quelle in `requirements.txt`.

### Vercel free tier — limiti
- Bandwidth: 100 GB/mese (per un sito vetrina sono milioni di visite, non li raggiungerai mai).
- Function executions: 100k/giorno (idem).
- Function size: 250 MB (siamo a ~60 MB con i requirements lean).

---

## Riepilogo URL finali

Dopo il deploy avrai:

| Cosa | URL |
|---|---|
| Sito pubblico | `https://tramaviva.vercel.app` (poi `tramaviva.it`) |
| API backend | `https://tramaviva-api.vercel.app` (poi `api.tramaviva.it`) |
| Dashboard admin | `https://tramaviva.vercel.app/admin` |
| Atlas database | gestito da MongoDB cloud |

Tutto **gratis**, **always-on**, **scalabile automaticamente**.

---

## Quando passerai a pagamento (futuro)

- Atlas si paga ($9/mese) solo se superi 512 MB di dati. Per registro soci è dura: con 10.000 record sei a ~5 MB.
- Vercel Hobby (gratis) basta. Pro ($20/mese) serve solo per multi-utenti o domini multipli importanti.
- Quando arriverà la newsletter con Resend: 3.000 email/mese gratis. Se superi, passi a $20/mese.

**In sintesi: per i prossimi 1-2 anni il sito girerà gratis senza problemi.**
