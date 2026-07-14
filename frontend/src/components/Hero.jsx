import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ThreadsBg } from "./ThreadsBg";
import { ArrowDownRight, Sparkles } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const Hero = () => {
  const scrollTo = (href) => (e) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const [events, setEvents] = useState([]);
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/events`)
      .then(r => r.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter(ev => { const d = new Date(ev.date); d.setHours(0,0,0,0); return d >= today; })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  // Timer live — aggiorna ogni secondo per il countdown
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="hero"
      data-testid="hero-section"
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-tv-cream"
    >
      <ThreadsBg className="absolute inset-0 w-full h-full" opacity={0.25} />
      {/* Decorative color blobs */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-tv-green/30 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-24 w-[320px] h-[320px] rounded-full bg-tv-mint/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-[280px] h-[280px] rounded-full bg-tv-sky/25 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-12 gap-10 items-end">
        <div className="md:col-span-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tv-green-deep/90 text-tv-cream text-xs font-bold uppercase tracking-wider mb-8">
            <Sparkles size={14} />
            APS · Associazione di Promozione Sociale
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-8xl leading-[0.95] tracking-tight text-tv-green-deep">
            Intrecciamo{" "}
            <span className="italic font-light text-tv-bordeaux">storie</span>,
            <br />
            persone e{" "}
            <span className="italic font-light text-tv-sky">opportunità</span>.
          </h1>
          <p className="mt-8 max-w-xl text-lg md:text-xl text-tv-green-deep/75 font-medium">
            Ogni filo conta. Noi siamo <b className="text-tv-green-deep">Trama Viva</b> —
            l'APS che tesse relazioni autentiche tra persone, per far crescere una comunità viva.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#eventi"
              onClick={scrollTo("#eventi")}
              data-testid="hero-cta-eventi"
              className="btn-tv inline-flex items-center gap-2 px-7 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold text-base hover:bg-tv-green"
            >
              Scopri gli eventi
              <ArrowDownRight size={18} />
            </a>
            <a
              href="#iscrizione"
              onClick={scrollTo("#iscrizione")}
              data-testid="hero-cta-iscrizione"
              className="btn-tv inline-flex items-center gap-2 px-7 py-4 rounded-full bg-tv-orange text-tv-green-deep font-bold text-base hover:bg-tv-orange/90"
            >
              Diventa socio: unisciti alla trama
            </a>
          </div>
        </div>

        <div className="md:col-span-4 md:pb-4">
          {/* Tagline card */}
          <div className="relative rounded-[2rem] p-7 bg-tv-green text-tv-cream shadow-[0_20px_60px_-20px_rgba(5,47,23,0.4)] rotate-[-2deg]">
            <div className="text-xs uppercase tracking-widest opacity-75 mb-2">
              La nostra trama
            </div>
            <div className="font-display font-black text-3xl leading-tight">
              Ogni<br />filo<br />conta.
            </div>
            <div className="mt-4 text-sm opacity-90">
              Vogliamo intrecciare storie, passioni e persone per creare una community fatta di valori condivisi. 
              Diamo vita ad esperienze e momenti di condivisione autentici, in cui sentirci liberi di creare legami veri. Diventa socio e prendi parte all’avventura. 
            </div>
            <svg viewBox="0 0 100 100" className="absolute -bottom-6 -right-6 w-20 h-20 opacity-90">
              <circle cx="50" cy="50" r="44" fill="#F9ECD4" />
              <g stroke="#551118" strokeWidth="1.5" fill="none">
                <line x1="50" y1="10" x2="50" y2="90" />
                <line x1="10" y1="50" x2="90" y2="50" />
                <line x1="22" y1="22" x2="78" y2="78" />
                <line x1="78" y1="22" x2="22" y2="78" />
                <circle cx="50" cy="50" r="18" />
                <circle cx="50" cy="50" r="30" />
              </g>
              <circle cx="50" cy="50" r="4" fill="#551118" />
            </svg>
          </div>
          <div className="mt-6 rounded-3xl p-6 bg-tv-cream border border-tv-green-deep/10 rotate-[1.5deg]">
            <div className="text-xs font-bold uppercase text-tv-bordeaux tracking-wider">
              Attivi dal 2026
            </div>
            <div className="mt-2 text-tv-green-deep/80 text-sm">
              Appena nati, già pieni di idee. Porta le tue.
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative mt-20 border-y border-tv-green-deep/15 py-3 overflow-hidden bg-tv-green-deep">
        <div className="flex marquee-track whitespace-nowrap text-tv-cream font-display font-black text-xl md:text-2xl lg:text-3xl tracking-tight">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 px-6">
              <span>Passeggiamo in gruppo</span>
              <span className="text-tv-orange">✦</span>
              <span>Chiacchieriamo al bar</span>
              <span className="text-tv-sky">✦</span>
              <span>Facciamo colazione insieme</span>
              <span className="text-tv-orange">✦</span>
              <span>Riqualifichiamo spazi</span>
              <span className="text-tv-sky">✦</span>
              <span>Formiamo sulla tecnologia</span>
              <span className="text-tv-orange">✦</span>
              <span>Esploriamo musei</span>
              <span className="text-tv-sky">✦</span>
              <span>Creiamo Musica</span>
              <span className="text-tv-orange">✦</span>
              <span>Abbiamo a cuore la salute</span>
              <span className="text-tv-sky">✦</span>
              <span className="italic font-light">Ogni filo conta</span>
              <span className="text-tv-orange">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prossimi eventi — countdown live per ogni evento */}
      {upcomingEvents.length > 0 && (
        <div className="border-b border-tv-green-deep/10 bg-tv-green-deep/[0.03]">
          <div className="mx-auto max-w-7xl px-4 md:px-10 py-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-tv-green-deep/35 mb-2">
              Prossimi eventi
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {upcomingEvents.map(ev => {
                const target = new Date(ev.date);
                if (ev.time) {
                  const [h, m] = ev.time.split(":");
                  target.setHours(parseInt(h), parseInt(m), 0, 0);
                } else {
                  target.setHours(0, 0, 0, 0);
                }
                const msLeft = Math.max(0, target - now);
                const days = Math.floor(msLeft / 86400000);
                const hours = Math.floor((msLeft % 86400000) / 3600000);
                const minutes = Math.floor((msLeft % 3600000) / 60000);
                const seconds = Math.floor((msLeft % 60000) / 1000);
                const isToday = days === 0 && msLeft > 0;
                const units = isToday
                  ? [{ v: hours, l: "hh" }, { v: minutes, l: "mm" }, { v: seconds, l: "ss" }]
                  : [{ v: days, l: "gg" }, { v: hours, l: "hh" }, { v: minutes, l: "mm" }, { v: seconds, l: "ss" }];
                return (
                  <Link
                    key={ev.id}
                    to={`/eventi/${ev.slug || ev.id}`}
                    className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[9px] text-tv-cream/45 mb-0.5">
                        {new Date(ev.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                        {ev.time ? ` · ${ev.time}` : ""}
                      </div>
                      <div className="text-sm font-bold leading-snug line-clamp-1">{ev.title}</div>
                    </div>
                    {msLeft === 0 ? (
                      <span className="text-sm font-black text-tv-orange">Concluso</span>
                    ) : (
                      <div className="flex gap-1.5">
                        {units.map(({ v, l }) => (
                          <div key={l} className="text-center bg-tv-cream/10 rounded-xl px-2 py-1.5 flex-1">
                            <div className="font-display font-black text-lg leading-none tabular-nums">
                              {String(v).padStart(2, "0")}
                            </div>
                            <div className="text-[8px] uppercase text-tv-cream/45 mt-0.5">{l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
