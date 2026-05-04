import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ChiSiamo from "./components/ChiSiamo";
import Attivita from "./components/Attivita";
import Eventi from "./components/Eventi";
import Iscrizione from "./components/Iscrizione";
import Contatti from "./components/Contatti";
import Footer from "./components/Footer";
import Admin from "./components/Admin";
import EventoDettaglio from "./components/EventoDettaglio";

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
      <Iscrizione />
      <Contatti />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/eventi/:slug" element={<EventoDettaglio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
