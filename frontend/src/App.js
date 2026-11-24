import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster, toast } from "sonner";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ChiSiamo from "./components/ChiSiamo";
import Eventi from "./components/Eventi";
import Iscrizione from "./components/Iscrizione";
import { IscrizioneExpanded } from "./components/IscrizioneExpanded";
import Contatti from "./components/Contatti";
import Footer from "./components/Footer";
import Admin from "./components/Admin";
import EventoDettaglio from "./components/EventoDettaglio";
import { EventiArchivio } from "./components/EventiArchivio";
import { ProgettiPage, ProgettoDettaglio } from "./components/Progetti";
import { ClubDelLibro, ClubDelLibroTeaser } from "./components/ClubDelLibro";
import { Cineforum, CineforumTeaser } from "./components/Cineforum";
import { LibroDettaglio } from "./components/LibroDettaglio";
import { AuthProvider } from "./context/AuthContext";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./components/Auth";
import { AreaSoci } from "./components/AreaSoci";
import { Donazioni, DonazioniTeaser } from "./components/Donazioni";
import { CancellaPrenotazione } from "./components/CancellaPrenotazione";
import { PrivacyPolicy, CookiePolicy, ConditionsPage, AccessibilityPage } from "./components/LegalPages";
import CookieBanner from "./components/CookieBanner";
import { initModalA11y } from "./lib/modalA11y";

const ClubsSection = () => (
  <section className="pt-0 pb-10 md:pb-14">
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-tv-bordeaux" />
          <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/75">I nostri club</span>
        </div>
        <h2 className="font-display font-black text-3xl md:text-4xl text-tv-green-deep leading-tight">
          Gruppi che si ritrovano, sempre.
        </h2>
        <p className="mt-2 text-tv-green-deep/75 max-w-xl">
          Non eventi isolati, ma comunità con un ritmo: incontri periodici, discussioni, un filo che lega ogni appuntamento al successivo.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <ClubDelLibroTeaser />
        <CineforumTeaser />
      </div>
    </div>
  </section>
);

const Home = () => {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main">
        <Hero />
        <ChiSiamo />
        <Eventi />
        <ClubsSection />
        <DonazioniTeaser />
        <Iscrizione />
        <Contatti />
      </main>
      <Footer />
    </div>
  );
};

// Rileva il ritorno da SumUp (?paid=<id>) e conferma il pagamento solo se SumUp lo ha davvero incassato
const PaymentReturnHandler = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidId = params.get("paid");
    if (!paidId) return;

    // Rimuove il param dall'URL senza ricaricare la pagina
    const clean = new URL(window.location.href);
    clean.searchParams.delete("paid");
    window.history.replaceState({}, "", clean.toString());

    fetch(`${BACKEND_URL}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_id: paidId }),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("verify failed"))))
      .then(data => {
        if (data.paid) {
          toast.success(
            data.kind === "registration"
              ? "Pagamento completato! La tua iscrizione è confermata."
              : "Pagamento completato! Grazie."
          );
        } else {
          toast.warning(
            "Il pagamento non risulta completato. Se hai interrotto l'operazione puoi riprovare; se invece hai pagato, scrivici e verificheremo.",
            { duration: 10000 }
          );
        }
      })
      .catch(() => {
        toast.warning(
          "Non siamo riusciti a verificare il pagamento. Se hai pagato, scrivici e verificheremo.",
          { duration: 10000 }
        );
      });
  }, []);
  return null;
};

const IscrizionePageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main"><IscrizioneExpanded /></main>
      <Footer />
    </div>
  );
};

const ClubDelLibroPageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main"><ClubDelLibro /></main>
      <Footer />
    </div>
  );
};

const CineforumPageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main"><Cineforum /></main>
      <Footer />
    </div>
  );
};

const LibroDettaglioPageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main"><LibroDettaglio /></main>
      <Footer />
    </div>
  );
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Titolo della scheda per ogni pagina: chi usa uno screen reader lo sente a ogni cambio di pagina.
const DEFAULT_TITLE = document.title;
const ROUTE_TITLES = {
  "/eventi/archivio": "Archivio eventi",
  "/progetti": "Progetti",
  "/donazioni": "Dona",
  "/iscrizione": "Diventa socio",
  "/club-del-libro": "Club del Libro",
  "/cineforum": "Cineforum",
  "/area-soci": "Area soci",
  "/login": "Accedi",
  "/registrati": "Crea il tuo account",
  "/password-dimenticata": "Password dimenticata",
  "/privacy-policy": "Informativa sulla privacy",
  "/cookie-policy": "Cookie policy",
  "/condizioni": "Condizioni di iscrizione e rimborso",
  "/accessibilita": "Dichiarazione di accessibilità",
};
const RouteTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === "/") document.title = DEFAULT_TITLE;
    else if (ROUTE_TITLES[pathname]) document.title = `${ROUTE_TITLES[pathname]} — APS Trama Viva`;
  }, [pathname]);
  return null;
};

function useHeartbeat() {
  useEffect(() => {
    // Identificativo casuale valido solo finché la scheda resta aperta (sessionStorage): non resta nel browser dopo la chiusura.
    let sessionId = null;
    try { sessionId = sessionStorage.getItem("tv_session_id"); } catch { /* storage non disponibile */ }
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { sessionStorage.setItem("tv_session_id", sessionId); } catch { /* si usa solo in memoria */ }
    }
    // Ogni ping è un'invocazione della funzione serverless: si manda solo mentre la scheda
    // è visibile e qualcuno la sta usando, e al massimo ogni 2 minuti.
    const PING_MS = 120000;
    const IDLE_MS = 30 * 60 * 1000; // dopo 30 min senza interazioni la visita si considera finita
    let lastActivity = Date.now();
    let lastPing = 0;
    let timer = null;

    const isVisible = () => document.visibilityState === "visible";
    const send = () => {
      if (!isVisible() || Date.now() - lastActivity > IDLE_MS) return;
      lastPing = Date.now();
      fetch(`${BACKEND_URL}/api/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {});
    };
    const start = () => {
      if (timer || !isVisible()) return;
      if (Date.now() - lastPing >= PING_MS) send();
      timer = setInterval(send, PING_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (isVisible() ? start() : stop());
    const onActivity = () => {
      const wasIdle = Date.now() - lastActivity > IDLE_MS;
      lastActivity = Date.now();
      if (wasIdle && Date.now() - lastPing >= PING_MS) send();
    };

    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    document.addEventListener("visibilitychange", onVisibility);
    activityEvents.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      activityEvents.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, []);
}

function App() {
  useHeartbeat();
  useEffect(() => initModalA11y(), []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main" className="skip-link">Salta al contenuto</a>
        <Toaster position="top-center" richColors />
        <PaymentReturnHandler />
        <RouteTitle />
        <CookieBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/progetti" element={<ProgettiPage />} />
          <Route path="/progetti/:slug" element={<ProgettoDettaglio />} />
          <Route path="/eventi/archivio" element={<EventiArchivio />} />
          <Route path="/eventi/:slug" element={<EventoDettaglio />} />
          <Route path="/iscrizione" element={<IscrizionePageWrapper />} />
          <Route path="/club-del-libro" element={<ClubDelLibroPageWrapper />} />
          <Route path="/club-del-libro/:bookId" element={<LibroDettaglioPageWrapper />} />
          <Route path="/cineforum" element={<CineforumPageWrapper />} />
          <Route path="/area-soci" element={<AreaSoci />} />
          <Route path="/donazioni" element={<Donazioni />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrati" element={<RegisterPage />} />
          <Route path="/password-dimenticata" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/cancella/:token" element={<CancellaPrenotazione />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/condizioni" element={<ConditionsPage />} />
          <Route path="/accessibilita" element={<AccessibilityPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
