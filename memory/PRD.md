# APS Trama Viva — PRD

## Original Problem Statement (IT)
Sito vetrina per APS Trama Viva. Palette: Leaf Green #5CB176 (80%), Soft Cream #F9ECD4 (15%), Sky Blue #429DD0 (5%), Mint #92C8B9 (15%), Bordeaux #551118 (5%), Orange #F59E0B (5%). Tono: fresco, giovanile, a tratti ironico. Attività: Aperitivi Sociali, Passeggiate, Screening Salute, Corsi IT Base. Tagline: "Intrecciamo storie, persone e opportunità. Ogni filo conta." Logo: ragnatela + ragnetto. Social: IG @tramavivaaps, email tramavivaaps@gmail.com. Deploy finale: Vercel + GitHub.

## Stack
- Frontend: React CRA (template), Tailwind, Shadcn UI, sonner, lucide-react
- Backend: FastAPI + MongoDB (motor)
- Fonts: Cabinet Grotesk (headings) + Manrope (body)

## User Personas
- Giovani 20–35 del quartiere in cerca di socialità reale
- Adulti / over 50 interessati a corsi IT base e screening salute
- Potenziali soci che vogliono proporre attività

## Core Requirements (static)
1. Sito monopagina con navigazione ad ancore
2. Sezioni: Home/Hero, Chi Siamo, Attività, Eventi, Iscrizione, Contatti
3. Form di iscrizione evento (richiesta partecipazione)
4. Form iscrizione soci (richiesta, non iscrizione diretta)
5. Form contatti
6. Persistenza in MongoDB (no invio email)
7. Design coerente con palette, tono ironico-giovanile

## What's been implemented (2025-12)
- [2025-12] Backend FastAPI con endpoints:
  - GET /api/ (tagline)
  - GET /api/events (6 eventi seed)
  - GET /api/events/{id}
  - POST /api/event-signup
  - POST /api/membership
  - POST /api/contact
  - POST /api/admin/login (token-based)
  - GET /api/admin/memberships, /api/admin/event-signups, /api/admin/contacts (Bearer token)
  - DELETE /api/admin/{collection}/{id}
- [2025-12] Frontend React con tutte le 7 sezioni, logo ufficiale (mark + full), navbar sticky glass, marquee, bento tetris attività, modale partecipazione eventi, form iscrizione soci, form contatti, footer bordeaux con logo grande
- [2025-12] Pagina admin /admin: login a password (ADMIN_TOKEN env), dashboard 3 tab, export CSV, delete per riga
- [2025-12] Bug fix: card "Aperitivi Sociali" che si restringeva (rimossa classe Tailwind in conflitto md:col-auto)

## Prioritized Backlog

### P0 (prossimo)
- Sostituire logo SVG placeholder con file logo ufficiale caricato dall'utente
- Setup repo GitHub + deploy su Vercel (frontend statico) + backend separato (Railway/Render)
  - **NOTA**: Vercel ospita bene solo il frontend CRA. Backend FastAPI+MongoDB va deployato altrove (Railway, Fly, Render) e si configura `REACT_APP_BACKEND_URL` nel dashboard Vercel.

### P1
- Pagina admin protetta per visualizzare iscrizioni/contatti (lista + export CSV)
- Calendario eventi interattivo (Shadcn Calendar)
- Pagina dettaglio singolo evento con URL `/eventi/:id`
- CMS eventi (dashboard per pubblicare nuovi eventi dal backend invece che hardcoded)

### P2
- Newsletter signup + integrazione Resend
- Gallery foto degli eventi passati
- Blog/storie dei soci
- Download statuto APS / documenti
- Multilingua (IT/EN)
- Integrazione Instagram feed live

## Credentials / Keys
Nessuna. Nessuna integrazione 3rd party in v1.

## Deploy notes
- Frontend Vercel: build command `yarn build`, output `build/`, env `REACT_APP_BACKEND_URL`
- Backend: deploy separato (non Vercel — Vercel serverless non supporta motor/Mongo persistente comodamente). Opzioni: Railway, Fly.io, Render (anche se utente vuole evitarlo), o VPS.
- MongoDB: usare MongoDB Atlas free tier in produzione.
