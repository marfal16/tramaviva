import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { PastEventCard, sortPastDesc } from "./Eventi";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Pagina con tutti gli eventi passati, dal più recente al più vecchio, filtrabili per categoria.
export const EventiArchivio = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    (async () => {
      try {
        const res = await axios.get(`${API}/events`);
        setEvents(res.data);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const past = useMemo(() => sortPastDesc(events), [events]);
  const categories = useMemo(
    () => [...new Set(past.map((e) => e.category).filter(Boolean))],
    [past]
  );
  const shown = category === "all" ? past : past.filter((e) => e.category === category);

  const chip = (active) =>
    `px-4 py-2 rounded-full text-sm font-bold transition-all ${
      active
        ? "bg-tv-green-deep text-tv-cream"
        : "bg-white text-tv-green-deep/75 hover:bg-tv-sky/30 border border-tv-green-deep/10"
    }`;

  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main" className="pt-32 pb-20 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Link
            to="/#eventi"
            data-testid="archivio-back-link"
            className="inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep/75 hover:text-tv-green-deep mb-8"
          >
            <ArrowLeft size={16} /> Torna agli eventi
          </Link>

          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            Archivio
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Gli eventi <span className="italic font-light text-tv-bordeaux">che abbiamo vissuto</span>
          </h1>

          {loading ? (
            <p className="mt-10 text-tv-green-deep/75" data-testid="archivio-loading">Caricamento…</p>
          ) : error ? (
            <p className="mt-10 text-tv-green-deep/75">Non siamo riusciti a caricare gli eventi. Riprova tra poco.</p>
          ) : past.length === 0 ? (
            <p className="mt-10 text-tv-green-deep/75">Non ci sono ancora eventi passati.</p>
          ) : (
            <>
              <p className="mt-4 text-tv-green-deep/75">
                {past.length} eventi, dal più recente al più vecchio.
              </p>

              {categories.length > 1 && (
                <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtra per categoria" data-testid="archivio-filtri">
                  <button type="button" onClick={() => setCategory("all")} aria-pressed={category === "all"} className={chip(category === "all")}>
                    Tutti
                  </button>
                  {categories.map((c) => (
                    <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} className={chip(category === c)}>
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4" data-testid="archivio-griglia">
                {shown.map((ev) => (
                  <PastEventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventiArchivio;
