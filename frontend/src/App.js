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
      <ClubDelLibroTeaser />
      <Eventi />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
