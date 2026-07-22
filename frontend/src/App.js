import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "sonner";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ChiSiamo from "./components/ChiSiamo";
import Attivita from "./components/Attivita";
import Eventi from "./components/Eventi";
import Iscrizione from "./components/Iscrizione";
import { IscrizioneExpanded } from "./components/IscrizioneExpanded";
import Contatti from "./components/Contatti";
import Footer from "./components/Footer";
import Admin from "./components/Admin";
import EventoDettaglio from "./components/EventoDettaglio";
import { ClubDelLibro, ClubDelLibroTeaser } from "./components/ClubDelLibro";
import { LibroDettaglio } from "./components/LibroDettaglio";

const ClubsSection = () => (
  <section className="py-14 md:py-20 px-6 md:px-10">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-tv-bordeaux" />
          <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/40">I nostri club</span>
        </div>
        <h2 className="font-display font-black text-3xl md:text-4xl text-tv-green-deep leading-tight">
          Gruppi che si ritrovano, sempre.
        </h2>
        <p className="mt-2 text-tv-green-deep/55 max-w-xl">
          Non eventi isolati, ma comunità con un ritmo: incontri periodici, discussioni, un filo che lega ogni appuntamento al successivo.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ClubDelLibroTeaser />
        {/* Future clubs: <CineforumTeaser />, <GiochiDaTavoloTeaser />, … */}
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
      <Hero />
      <ChiSiamo />
      <Attivita />
      <Eventi />
      <ClubsSection />
      <Iscrizione />
      <Contatti />
      <Footer />
    </div>
  );
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Rileva il ritorno da SumUp (?paid=<registration_id>) e conferma il pagamento
const PaymentReturnHandler = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidId = params.get("paid");
    if (!paidId) return;

    // Rimuove il param dall'URL senza ricaricare la pagina
    const clean = new URL(window.location.href);
    clean.searchParams.delete("paid");
    window.history.replaceState({}, "", clean.toString());

    fetch(`${BACKEND_URL}/api/registrations/${paidId}/payment-completed`, { method: "POST" })
      .then(() => toast.success("Pagamento completato! La tua iscrizione è confermata."))
      .catch(() => {});
  }, []);
  return null;
};

const IscrizionePageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <IscrizioneExpanded />
      <Footer />
    </div>
  );
};

const ClubDelLibroPageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <ClubDelLibro />
      <Footer />
    </div>
  );
};

const LibroDettaglioPageWrapper = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <LibroDettaglio />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <PaymentReturnHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/eventi/:slug" element={<EventoDettaglio />} />
        <Route path="/iscrizione" element={<IscrizionePageWrapper />} />
        <Route path="/club-del-libro" element={<ClubDelLibroPageWrapper />} />
        <Route path="/club-del-libro/:bookId" element={<LibroDettaglioPageWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
