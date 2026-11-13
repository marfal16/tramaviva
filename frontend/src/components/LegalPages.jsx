import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ORG, LEGAL_UPDATED } from "../lib/legal";
import { openCookieSettings, POSTHOG_IN_EU } from "../lib/consent";

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
            <Td>Tua richiesta di donare e gestione della donazione (art. 6.1.b), obblighi contabili e fiscali (art. 6.1.c)</Td>
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
            <Td>Conteggio visite (sempre attivo, anonimo)</Td>
            <Td>Identificativo casuale valido solo finché la scheda del browser è aperta; paese e città dedotti dalla connessione. Non salviamo il tuo indirizzo IP e non lo inviamo a servizi esterni.</Td>
            <Td>Sapere in forma aggregata quante persone visitano il sito e da dove</Td>
            <Td>Legittimo interesse a conoscere l'uso del sito con dati anonimi (art. 6.1.f)</Td>
          </tr>
          <tr>
            <Td>Statistiche (solo se acconsenti)</Td>
            <Td>Pagine visitate, dati tecnici del dispositivo, registrazione delle sessioni di navigazione, con testi e campi dei moduli oscurati</Td>
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
          `PostHog — statistiche del sito, solo se hai dato il consenso (server ${POSTHOG_IN_EU ? "nell'Unione Europea" : "negli Stati Uniti"}).`,
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
          "Messaggi dal form «Scrivici»: 24 mesi dall'invio, poi vengono cancellati.",
          "Iscrizione come socio: i dati del modulo online (documento, codice fiscale, residenza e simili) restano sul sito solo fino alla chiusura della pratica, cioè fino a quando riceviamo il modulo cartaceo firmato: poi vengono cancellati. Le iscrizioni online mai approvate sono cancellate dopo 12 mesi. Restano nome, cognome, contatti e numero di tessera per la durata del rapporto associativo; il modulo cartaceo e il libro soci sono conservati secondo la legge e il Codice del Terzo settore.",
          "Prenotazioni agli eventi: 24 mesi dopo la data dell'evento; poi nome, email, telefono, messaggi e dati degli accompagnatori vengono cancellati e restano solo importi e numero di partecipanti, in forma anonima.",
          "Donazioni: 10 anni, per gli obblighi contabili e fiscali; poi restano solo importo e data, in forma anonima.",
          "Account area soci: finché l'account è attivo; puoi chiederne la chiusura in ogni momento.",
          "Registro delle scelte sui cookie: 5 anni, per poter dimostrare il consenso.",
          "Conteggio visite anonimo: 13 mesi.",
          "Statistiche del sito con PostHog (solo se acconsenti): non oltre 12 mesi.",
          "Consensi facoltativi: fino alla revoca.",
        ]}
      />
    </Sec>

    <Sec title="8. I tuoi diritti">
      <p>
        In ogni momento puoi chiederci di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento,
        riceverli in un formato leggibile (portabilità) o opporti al trattamento. Puoi revocare i consensi dati, senza
        che ciò pregiudichi il trattamento precedente. Per esercitare i tuoi diritti scrivi a <Mail />: rispondiamo entro un mese. Non facciamo profilazione e non prendiamo decisioni basate soltanto su trattamenti automatizzati.
      </p>
      <p>
        Se ritieni che il trattamento violi la normativa puoi presentare reclamo al{" "}
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">
          Garante per la protezione dei dati personali<span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>.
      </p>
    </Sec>

    <Sec title="9. Foto e video degli eventi">
      <p>
        Durante alcuni eventi possiamo fare foto o video. Avvisiamo i partecipanti prima dell'evento. Le immagini in cui sei riconoscibile
        sono pubblicate sul sito o sui social solo se hai dato il consenso (nel modulo di iscrizione per i soci, oppure a voce all'evento).
        Se non vuoi comparire, dillo a chi organizza: eviteremo di riprenderti. Puoi chiedere in ogni momento di togliere una foto scrivendo a <Mail />.
      </p>
    </Sec>

    <Sec title="10. Pagine social">
      <p>
        Sul sito ci sono solo collegamenti alle nostre pagine su Instagram, Facebook e TikTok. Quando le usi, i tuoi dati sono trattati
        anche da quelle piattaforme secondo le loro informative.
      </p>
    </Sec>

    <Sec title="11. Cookie">
      <p>
        Per i cookie e gli strumenti simili che usiamo leggi la <a href="/cookie-policy" className="font-bold underline underline-offset-2">Cookie Policy</a>.
      </p>
    </Sec>

    <Sec title="12. Modifiche">
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
          <tr><Td>tv_session_id</Td><Td>Trama Viva (session storage)</Td><Td>Identificativo casuale e anonimo per contare in forma aggregata quante persone visitano il sito. Non contiene dati personali e non salviamo il tuo indirizzo IP.</Td><Td>Fino alla chiusura della scheda del browser</Td></tr>
          <tr><Td>Password della community (club)</Td><Td>Trama Viva (local storage)</Td><Td>Evita di reinserire la password dei club quando torni</Td><Td>Finché non cancelli i dati del sito</Td></tr>
          <tr><Td>_GRECAPTCHA e simili</Td><Td>Google reCAPTCHA</Td><Td>Distingue le persone dai programmi automatici nei moduli e nel login, per proteggerli da abusi</Td><Td>Fino a 6 mesi</Td></tr>
        </tbody>
      </TableWrap>
    </Sec>

    <Sec title="Cookie di statistica (solo con il tuo consenso)">
      <TableWrap label="Cookie di statistica">
        <thead><tr><Th>Nome</Th><Th>Chi lo imposta</Th><Th>Scopo</Th><Th>Durata</Th></tr></thead>
        <tbody>
          <tr><Td>ph_phc_… (cookie e local storage)</Td><Td>PostHog (server {POSTHOG_IN_EU ? "nell'Unione Europea" : "negli USA"})</Td><Td>Statistiche sulle visite e registrazione delle sessioni di navigazione, con testi e campi dei moduli oscurati.</Td><Td>Fino a 12 mesi</Td></tr>
        </tbody>
      </TableWrap>
      <p>Finché non acconsenti, questi strumenti non vengono caricati. Nel pannello di amministrazione non sono mai attivi.</p>
    </Sec>

    <Sec title="Contenuti di terze parti">
      <List
        items={[
          "Caratteri tipografici: sono ospitati sul nostro sito, quindi il tuo browser non contatta server esterni per caricarli.",
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

// ─── Condizioni di iscrizione, cancellazione e rimborso ──────────────────────
export const ConditionsPage = () => (
  <Page
    title="Condizioni di iscrizione, cancellazione e rimborso"
    intro="Queste condizioni valgono per le richieste di partecipazione agli eventi di Trama Viva APS inviate dal sito. Sono scritte in modo semplice: se qualcosa non ti è chiaro, scrivici prima di inviare la richiesta."
  >
    <Sec title="1. Chi organizza">
      <p>
        <strong>{ORG.name}</strong> — Associazione di Promozione Sociale senza scopo di lucro, {ORG.runts}.<br />
        Sede legale: {ORG.address} · C.F. {ORG.cf}<br />
        Contatti: <Mail />
      </p>
    </Sec>

    <Sec title="2. Come funziona la richiesta di partecipazione">
      <List
        items={[
          "Dal sito invii una richiesta di partecipazione. Dopo l'invio ricevi un'email di riepilogo.",
          "I posti sono limitati: se sono finiti puoi metterti in lista d'attesa e ti avvisiamo se se ne libera uno.",
          "La partecipazione è confermata dall'associazione con un'email.",
          "Alcuni eventi sono riservati ai soci. In quel caso serve l'email con cui sei registrato come socio.",
          "Se porti accompagnatori ci servono i loro dati (nome, cognome, email diversa dalla tua): dichiari di averli informati.",
        ]}
      />
    </Sec>

    <Sec title="3. Contributo e pagamento">
      <List
        items={[
          "Il contributo è indicato nella pagina di ogni evento ed è l'importo per persona. Non aggiungiamo altri costi.",
          "Puoi pagare con carta (pagina sicura di SumUp), con bonifico o in contanti, secondo quanto previsto per l'evento.",
          "Se l'evento indica «da versare direttamente alla struttura», paghi al locale e non all'associazione.",
          "Dove previsto, puoi aggiungere una donazione volontaria: è facoltativa e separata dal contributo.",
          "Quando il pulsante dice «Invia richiesta con obbligo di pagare», l'invio comporta l'obbligo di pagare il contributo indicato.",
        ]}
      />
    </Sec>

    <Sec title="4. Come cancellare la prenotazione">
      <p>
        Puoi cancellare quando vuoi dal link «Cancella la prenotazione» che trovi nelle email che ti inviamo. I posti liberati tornano
        disponibili e scorrono la lista d'attesa: se non puoi venire, ti chiediamo di cancellare appena possibile.
      </p>
    </Sec>

    <Sec title="5. Rimborsi">
      <List
        items={[
          "Se la pagina dell'evento indica «contributo non rimborsabile», il contributo non viene restituito in caso di cancellazione o di mancata partecipazione.",
          <>Negli altri casi scrivici a <Mail />: valutiamo la restituzione tenendo conto dei costi che l'associazione ha già sostenuto per te.</>,
          "Se siamo noi ad annullare o a rinviare l'evento, ti restituiamo l'intero contributo già versato, oppure lo teniamo valido per la nuova data se preferisci.",
          "I rimborsi vengono fatti con lo stesso metodo che hai usato per pagare, senza ritardi ingiustificati.",
        ]}
      />
    </Sec>

    <Sec title="6. Diritto di recesso">
      <p>
        Per l'iscrizione a un evento con data fissa la legge non riconosce il diritto di recesso di 14 giorni previsto per gli acquisti
        a distanza (art. 59, comma 1, lettera n, del Codice del consumo, D.Lgs. 206/2005). Valgono le regole di cancellazione e di rimborso
        dei punti 4 e 5. Restano fermi gli altri diritti che la legge ti riconosce.
      </p>
    </Sec>

    <Sec title="7. Iscrizione all'associazione">
      <p>
        Le regole sull'ammissione, sulla quota associativa e sui diritti e doveri dei soci sono nello Statuto e nel Regolamento interno
        dell'associazione, che accetti con la domanda di iscrizione.
      </p>
    </Sec>

    <Sec title="8. Foto e video">
      <p>
        Durante gli eventi possiamo fare foto e video. Come trattiamo le immagini e come puoi opporti è spiegato nell'
        <a href="/privacy-policy" className="font-bold underline underline-offset-2">informativa sulla privacy</a>.
      </p>
    </Sec>

    <Sec title="9. Accessibilità del servizio di iscrizione">
      <p>
        I moduli di iscrizione e di prenotazione si possono compilare con la sola tastiera e con uno screen reader: ogni campo ha un'etichetta,
        gli errori vengono annunciati e la verifica anti-spam è invisibile. Se hai difficoltà a completare una richiesta scrivici: ti aiutiamo via email.
        Maggiori dettagli nella{" "}
        <a href="/accessibilita" className="font-bold underline underline-offset-2">dichiarazione di accessibilità</a>.
      </p>
    </Sec>

    <Sec title="10. Domande e reclami">
      <p>
        Per qualsiasi domanda o problema scrivi a <Mail />. Cerchiamo di rispondere il prima possibile.
      </p>
    </Sec>
  </Page>
);

// ─── Dichiarazione di accessibilità ──────────────────────────────────────────
export const AccessibilityPage = () => (
  <Page
    title="Dichiarazione di accessibilità"
    intro="Trama Viva APS vuole che il sito sia utilizzabile da tutte e da tutti, comprese le persone che usano uno screen reader, navigano solo con la tastiera o ingrandiscono lo schermo. Pubblichiamo questa dichiarazione di nostra iniziativa, per trasparenza."
  >
    <Sec title="Stato di conformità">
      <p>
        Il sito è <strong>parzialmente conforme</strong> alle Linee guida WCAG 2.1 livello AA (la norma europea EN 301 549 le richiama).
        Qui sotto trovi cosa funziona e cosa abbiamo ancora da sistemare. La valutazione è un'<strong>autovalutazione</strong> dell'associazione,
        fatta sul codice del sito: non è stata ancora verificata da persone che usano abitualmente uno screen reader.
      </p>
    </Sec>

    <Sec title="Cosa abbiamo fatto">
      <List
        items={[
          "Link «Salta al contenuto» all'inizio di ogni pagina e un titolo diverso per ogni pagina.",
          "Tutti i moduli hanno etichette collegate ai campi; gli errori vengono annunciati.",
          "Si può usare tutto il sito con la sola tastiera. Il focus è sempre ben visibile.",
          "Menu e finestre di dialogo si chiudono con il tasto Esc; dentro le finestre il focus resta nella finestra e poi torna dove era.",
          "I pulsanti con sola icona hanno un nome leggibile dagli screen reader; le immagini decorative sono nascoste.",
          "La verifica anti-spam (reCAPTCHA) è invisibile: non devi risolvere immagini o enigmi.",
          "Le animazioni si riducono se hai attivato «riduci movimento» nel tuo dispositivo.",
          "I testi secondari sono stati resi più scuri per migliorare il contrasto.",
        ]}
      />
    </Sec>

    <Sec title="Cosa non è ancora a posto">
      <List
        items={[
          "In alcune schede il testo chiaro su sfondo verde chiaro o azzurro ha un contrasto troppo basso (circa 1,8 a 1, sotto il minimo di 4,5 a 1).",
          "Non abbiamo ancora fatto prove con utenti di screen reader (NVDA, VoiceOver, TalkBack).",
          "Foto e contenuti pubblicati dai soci nella community possono non avere un testo alternativo.",
          "I documenti PDF generati dal sito (ad esempio il modulo di iscrizione) potrebbero non essere completamente accessibili.",
          "I video di YouTube nel Cineforum dipendono dai sottotitoli e dai comandi di YouTube.",
        ]}
      />
    </Sec>

    <Sec title="Segnala un problema o chiedi aiuto">
      <p>
        Se trovi una barriera o non riesci a usare una parte del sito, scrivi a <Mail />: indica la pagina e che cosa non funziona.
        Cerchiamo di risponderti entro 15 giorni. Se il problema ti impedisce di iscriverti, prenotare un evento o donare,
        ti aiutiamo noi a completare l'operazione via email. Se non ricevi risposta puoi anche rivolgerti ad AgID (Agenzia per l'Italia digitale),
        l'autorità che vigila sull'accessibilità dei servizi digitali.
      </p>
    </Sec>

    <Sec title="Tecnologie e metodo">
      <p>
        Il sito è costruito con HTML, CSS, JavaScript e attributi WAI-ARIA. Questa dichiarazione è stata preparata il {LEGAL_UPDATED}
        ed è rivista quando facciamo modifiche importanti al sito.
      </p>
    </Sec>
  </Page>
);

export default PrivacyPolicy;
