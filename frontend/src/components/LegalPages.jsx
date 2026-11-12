import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ORG, LEGAL_UPDATED } from "../lib/legal";
import { openCookieSettings } from "../lib/consent";

const Page = ({ title, intro, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    const previous = document.title;
    document.title = `${title} — APS Trama Viva`;
    return () => { document.title = previous; };
  }, [title]);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main" className="px-6 md:px-10 pt-28 pb-20 md:pt-36">
        <article className="mx-auto max-w-3xl rounded-[2rem] bg-white p-7 text-tv-green-deep md:p-12">
          <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-tv-green-deep/80">Ultimo aggiornamento: {LEGAL_UPDATED}</p>
          {intro && <p className="mt-6 leading-relaxed text-tv-green-deep/90">{intro}</p>}
          <div className="mt-8 space-y-8">{children}</div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

const Sec = ({ title, children }) => (
  <section>
    <h2 className="mb-3 font-display text-xl font-black md:text-2xl">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-tv-green-deep/90">{children}</div>
  </section>
);

const List = ({ items }) => (
  <ul className="list-disc space-y-1.5 pl-5">
    {items.map((i, idx) => <li key={idx}>{i}</li>)}
  </ul>
);

const Mail = () => (
  <a href={`mailto:${ORG.email}`} className="font-bold underline underline-offset-2">{ORG.email}</a>
);

const TableWrap = ({ children, label }) => (
  <div className="overflow-x-auto rounded-2xl border border-tv-green-deep/15" role="region" aria-label={label} tabIndex={0}>
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
  </div>
);
const Th = ({ children }) => <th scope="col" className="bg-tv-cream px-3 py-2 font-bold">{children}</th>;
const Td = ({ children }) => <td className="border-t border-tv-green-deep/10 px-3 py-2 align-top">{children}</td>;

// ─── Privacy Policy ──────────────────────────────────────────────────────────
export const PrivacyPolicy = () => (
  <Page
    title="Informativa sulla privacy"
    intro="Questa informativa spiega come trattiamo i tuoi dati personali quando usi il sito, ti iscrivi all'associazione, prenoti un evento, ci scrivi o ci sostieni con una donazione. È resa ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR)."
  >
    <Sec title="1. Titolare del trattamento">
      <p>
        <strong>{ORG.name}</strong> — Associazione di Promozione Sociale senza scopo di lucro, iscritta al {ORG.runts}.<br />
        Sede legale: {ORG.address} · C.F. {ORG.cf}<br />
        Email per qualsiasi richiesta sulla privacy: <Mail />
      </p>
    </Sec>

    <Sec title="2. Quali dati trattiamo, perché e su quale base">
      <TableWrap label="Finalità e basi giuridiche del trattamento">
        <thead>
          <tr><Th>Quando</Th><Th>Dati</Th><Th>Finalità</Th><Th>Base giuridica</Th></tr>
        </thead>
        <tbody>
          <tr>
            <Td>Form «Scrivici»</Td>
            <Td>Nome, email, testo del messaggio</Td>
            <Td>Rispondere alla tua richiesta</Td>
            <Td>Tuo consenso (art. 6.1.a) e richiesta precontrattuale/associativa (art. 6.1.b)</Td>
          </tr>
          <tr>
            <Td>Iscrizione come socio</Td>
            <Td>Dati anagrafici, codice fiscale, documento d'identità, residenza, recapiti; per i minorenni anche i dati di chi esercita la responsabilità genitoriale</Td>
            <Td>Gestire il rapporto associativo, tenere il libro soci, adempiere agli obblighi di legge e dello Statuto</Td>
            <Td>Rapporto associativo (art. 6.1.b) e obblighi di legge (art. 6.1.c)</Td>
          </tr>
          <tr>
            <Td>Consensi facoltativi del modulo di iscrizione</Td>
            <Td>Preferenze su comunicazioni, pubblicazione di immagini, contatto telefonico, chat di gruppo</Td>
            <Td>Inviarti comunicazioni, includerti nei canali dell'associazione, usare immagini degli eventi</Td>
            <Td>Tuo consenso (art. 6.1.a), revocabile in ogni momento</Td>
          </tr>
          <tr>
            <Td>Prenotazione a un evento</Td>
            <Td>Nome, email, telefono, eventuali scelte (es. opzioni di menu); nome, cognome ed email degli accompagnatori</Td>
            <Td>Gestire iscrizioni, lista d'attesa, conferme, promemoria e comunicazioni di servizio sull'evento</Td>
            <Td>Esecuzione della tua richiesta (art. 6.1.b) e consenso (art. 6.1.a)</Td>
          </tr>
          <tr>
            <Td>Donazioni</Td>
            <Td>Nome, cognome, email, telefono (facoltativo), importo, messaggio (facoltativo)</Td>
            <Td>Registrare la donazione, ringraziarti, adempiere agli obblighi contabili e fiscali</Td>
            <Td>Tuo consenso (art. 6.1.a), obblighi di legge (art. 6.1.c)</Td>
          </tr>
          <tr>
            <Td>Account area soci</Td>
            <Td>Nome, email, password (conservata solo in forma cifrata), foto e presentazione facoltative, contenuti che pubblichi</Td>
            <Td>Permetterti di accedere all'area riservata ai soci e alle sue funzioni</Td>
            <Td>Rapporto associativo (art. 6.1.b) e tuo consenso (art. 6.1.a)</Td>
          </tr>
          <tr>
            <Td>Navigazione e sicurezza</Td>
            <Td>Indirizzo IP, dati tecnici del browser, token reCAPTCHA</Td>
            <Td>Proteggere i moduli da abusi e invii automatici, garantire il funzionamento del sito</Td>
            <Td>Legittimo interesse alla sicurezza del sito (art. 6.1.f)</Td>
          </tr>
          <tr>
            <Td>Statistiche (solo se acconsenti)</Td>
            <Td>Pagine visitate, dati tecnici del dispositivo, registrazione anonima delle sessioni di navigazione (senza i campi dei moduli)</Td>
            <Td>Capire come migliorare il sito</Td>
            <Td>Tuo consenso (art. 6.1.a)</Td>
          </tr>
          <tr>
            <Td>Scelta sui cookie</Td>
            <Td>Identificativo casuale, scelta effettuata, data, versione dell'informativa, impronta non reversibile dell'IP</Td>
            <Td>Dimostrare di aver rispettato la tua scelta</Td>
            <Td>Obbligo di accountability (artt. 5.2 e 7.1 GDPR) e legittimo interesse</Td>
          </tr>
        </tbody>
      </TableWrap>
      <p>
        Il conferimento dei dati contrassegnati come obbligatori nei moduli è necessario per dare seguito alla tua richiesta:
        senza di essi non possiamo completare l'iscrizione, la prenotazione o la donazione. I consensi facoltativi
        e le statistiche non sono mai obbligatori e il loro rifiuto non ha conseguenze.
      </p>
    </Sec>

    <Sec title="3. Accompagnatori e dati di terze persone">
      <p>
        Se prenoti un evento per altre persone ci comunichi i loro dati: dichiari di averle informate e che sono d'accordo.
        Usiamo quei dati solo per gestire la loro partecipazione.
      </p>
    </Sec>

    <Sec title="4. Minori">
      <p>
        L'iscrizione di una persona minorenne richiede i dati e il consenso di chi ne esercita la responsabilità genitoriale.
      </p>
    </Sec>

    <Sec title="5. A chi comunichiamo i dati">
      <p>I dati sono trattati dai soci del direttivo e dai volontari autorizzati, che operano su nostre istruzioni. Ci avvaliamo inoltre di fornitori che trattano dati per nostro conto (responsabili del trattamento):</p>
      <List
        items={[
          "Vercel — hosting del sito e dei servizi applicativi.",
          "MongoDB Atlas — archiviazione dei dati del sito.",
          "Cloudinary — archiviazione delle immagini caricate (eventi, foto profilo).",
          "SumUp — pagamenti con carta di donazioni e quote. Non vediamo né conserviamo i dati della tua carta.",
          "Google — posta elettronica dell'associazione e servizio anti-spam reCAPTCHA.",
          "PostHog — statistiche del sito, solo se hai dato il consenso.",
        ]}
      />
      <p>
        I dati non sono venduti né diffusi. Possono essere comunicati ad autorità pubbliche solo se la legge lo impone.
      </p>
    </Sec>

    <Sec title="6. Trasferimenti fuori dall'Unione Europea">
      <p>
        Alcuni dei fornitori indicati hanno sede o infrastrutture negli Stati Uniti. Il trasferimento avviene sulla base
        di garanzie adeguate previste dal GDPR (decisione di adeguatezza «EU-US Data Privacy Framework» oppure Clausole
        Contrattuali Standard della Commissione europea).
      </p>
    </Sec>

    <Sec title="7. Per quanto tempo conserviamo i dati">
      <List
        items={[
          "Messaggi dal form «Scrivici»: il tempo necessario a rispondere e, in seguito, fino a 24 mesi.",
          "Iscrizione come socio: i dati identificativi e sensibili del modulo online sono conservati sul sito solo fino a quando riceviamo il modulo cartaceo firmato, poi sono cancellati. Restano nome, cognome, contatti e numero di tessera per la durata del rapporto associativo; il modulo cartaceo e il libro soci sono conservati secondo la legge e il Codice del Terzo settore.",
          "Prenotazioni agli eventi: fino a 24 mesi dalla data dell'evento.",
          "Donazioni: 10 anni, per gli obblighi contabili e fiscali.",
          "Account area soci: finché l'account è attivo; puoi chiederne la chiusura in ogni momento.",
          "Registro delle scelte sui cookie: fino a 5 anni, per poter dimostrare il consenso.",
          "Consensi facoltativi: fino alla revoca.",
        ]}
      />
    </Sec>

    <Sec title="8. I tuoi diritti">
      <p>
        In ogni momento puoi chiederci di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento,
        riceverli in un formato leggibile (portabilità) o opporti al trattamento. Puoi revocare i consensi dati, senza
        che ciò pregiudichi il trattamento precedente. Per esercitare i tuoi diritti scrivi a <Mail />: rispondiamo entro un mese.
      </p>
      <p>
        Se ritieni che il trattamento violi la normativa puoi presentare reclamo al{" "}
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">
          Garante per la protezione dei dati personali<span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>.
      </p>
    </Sec>

    <Sec title="9. Cookie">
      <p>
        Per i cookie e gli strumenti simili che usiamo leggi la <a href="/cookie-policy" className="font-bold underline underline-offset-2">Cookie Policy</a>.
      </p>
    </Sec>

    <Sec title="10. Modifiche">
      <p>
        Se questa informativa cambia, aggiorniamo la data in alto e, per le modifiche rilevanti, ti chiediamo di nuovo le
        scelte che dipendono da essa.
      </p>
    </Sec>
  </Page>
);

// ─── Cookie Policy ───────────────────────────────────────────────────────────
export const CookiePolicy = () => (
  <Page
    title="Cookie policy"
    intro="Questa pagina spiega quali cookie e strumenti simili (come il local storage del browser) usa il sito di Trama Viva APS, a cosa servono e come puoi scegliere."
  >
    <Sec title="Cookie tecnici (sempre attivi)">
      <p>Servono al funzionamento del sito e alla sua sicurezza; non richiedono consenso.</p>
      <TableWrap label="Cookie e storage tecnici">
        <thead><tr><Th>Nome</Th><Th>Chi lo imposta</Th><Th>Scopo</Th><Th>Durata</Th></tr></thead>
        <tbody>
          <tr><Td>socio_token</Td><Td>Trama Viva (local storage)</Td><Td>Mantiene l'accesso all'area soci dopo il login</Td><Td>Fino al logout (la sessione scade dopo 7 giorni)</Td></tr>
          <tr><Td>tv_cookie_consent</Td><Td>Trama Viva (local storage)</Td><Td>Ricorda la tua scelta sui cookie</Td><Td>6 mesi</Td></tr>
          <tr><Td>tv_session_id</Td><Td>Trama Viva (local storage)</Td><Td>Identificativo casuale e anonimo per contare quante persone sono sul sito in un dato momento</Td><Td>Finché non cancelli i dati del sito</Td></tr>
          <tr><Td>Password della community (club)</Td><Td>Trama Viva (local storage)</Td><Td>Evita di reinserire la password dei club quando torni</Td><Td>Finché non cancelli i dati del sito</Td></tr>
          <tr><Td>_GRECAPTCHA e simili</Td><Td>Google reCAPTCHA</Td><Td>Distingue le persone dai programmi automatici nei moduli e nel login, per proteggerli da abusi</Td><Td>Fino a 6 mesi</Td></tr>
        </tbody>
      </TableWrap>
    </Sec>

    <Sec title="Cookie di statistica (solo con il tuo consenso)">
      <TableWrap label="Cookie di statistica">
        <thead><tr><Th>Nome</Th><Th>Chi lo imposta</Th><Th>Scopo</Th><Th>Durata</Th></tr></thead>
        <tbody>
          <tr><Td>ph_phc_… (cookie e local storage)</Td><Td>PostHog (server negli USA)</Td><Td>Statistiche anonime sulle visite e registrazione delle sessioni di navigazione. I campi dei moduli non vengono registrati.</Td><Td>Fino a 12 mesi</Td></tr>
        </tbody>
      </TableWrap>
      <p>Finché non acconsenti, questi strumenti non vengono caricati. Nel pannello di amministrazione non sono mai attivi.</p>
    </Sec>

    <Sec title="Contenuti di terze parti">
      <List
        items={[
          "Caratteri tipografici (Google Fonts e Fontshare): al caricamento del sito il tuo browser li richiede ai rispettivi server, che ricevono il tuo indirizzo IP.",
          "Video di YouTube (trailer nelle pagine del Cineforum): sono caricati solo se premi «play», tramite il dominio a privacy rafforzata youtube-nocookie.com.",
          "Immagini di eventi e locandine (Cloudinary, TMDB): possono essere servite da server esterni.",
          "Pagamenti con carta: avvengono sulla pagina sicura di SumUp, soggetta alla sua informativa.",
          "Collegamenti ai social (Instagram, Facebook, TikTok): sono semplici link, non incorporiamo i loro plugin.",
        ]}
      />
    </Sec>

    <Sec title="Come cambiare la tua scelta">
      <p>
        Puoi modificare o revocare il consenso alle statistiche quando vuoi:{" "}
        <button
          type="button"
          onClick={openCookieSettings}
          className="font-bold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-green-deep"
        >
          apri le preferenze cookie
        </button>
        . Puoi anche cancellare i cookie dalle impostazioni del tuo browser.
      </p>
      <p>
        Chiedendoti di nuovo il consenso ogni 6 mesi, o quando questa policy cambia, rispettiamo le indicazioni del Garante.
        Per sapere come trattiamo i tuoi dati leggi l'<a href="/privacy-policy" className="font-bold underline underline-offset-2">Informativa sulla privacy</a>.
      </p>
      <p>Titolare: {ORG.name}, {ORG.address} — <Mail /></p>
    </Sec>
  </Page>
);

export default PrivacyPolicy;
