import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import {
  Wine, Mountain, Stethoscope, Laptop, Heart, Palette, Users, Sparkles,
  ArrowLeft, ArrowRight, ExternalLink, Calendar as CalendarIcon, MapPin,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { isPast } from "./Eventi";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Icone e colori tra cui scegliere dall'admin. Le classi sono scritte per intero perché Tailwind le riconosca.
export const PROJECT_ICONS = {
  wine: { label: "Calice", Icon: Wine },
  mountain: { label: "Montagna", Icon: Mountain },
  stethoscope: { label: "Stetoscopio", Icon: Stethoscope },
  laptop: { label: "Computer", Icon: Laptop },
  heart: { label: "Cuore", Icon: Heart },
  palette: { label: "Tavolozza", Icon: Palette },
  users: { label: "Persone", Icon: Users },
  sparkles: { label: "Scintille", Icon: Sparkles },
};

export const PROJECT_COLORS = {
  green: { label: "Verde", bg: "bg-tv-green", text: "text-tv-green-deep", chip: "bg-tv-green/25" },
  bordeaux: { label: "Bordeaux", bg: "bg-tv-bordeaux", text: "text-tv-cream", chip: "bg-tv-cream/15" },
  orange: { label: "Arancione", bg: "bg-tv-orange", text: "text-tv-green-deep", chip: "bg-tv-green-deep/10" },
  sky: { label: "Azzurro", bg: "bg-tv-sky", text: "text-tv-green-deep", chip: "bg-tv-green-deep/10" },
};

const iconOf = (key) => (PROJECT_ICONS[key] || PROJECT_ICONS.sparkles).Icon;
const colorOf = (key) => PROJECT_COLORS[key] || PROJECT_COLORS.green;
const isHttp = (u) => typeof u === "string" && /^https?:\/\//i.test(u);
const paragraphs = (text) => String(text || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

const Shell = ({ children }) => (
  <div className="App bg-tv-cream min-h-screen">
    <Navbar />
    <main id="main" className="pt-32 pb-20 md:pt-40">
      <div className="mx-auto max-w-7xl px-6 md:px-10">{children}</div>
    </main>
    <Footer />
  </div>
);

// ---------- Elenco dei progetti: /progetti ----------
export const ProgettiPage = () => {
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${API}/projects`).then((r) => setProjects(r.data)).catch(() => setError(true));
  }, []);

  return (
    <Shell>
      <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">Cosa facciamo</div>
          <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            I nostri progetti
          </h1>
        </div>
        <p className="max-w-sm text-tv-green-deep/75 text-base">
          Le nostre attività variano, ma la trama resta la stessa: farti incontrare persone vere,
          fuori dallo schermo. Scegli un progetto per scoprire di più.
        </p>
      </div>

      {error ? (
        <p className="text-tv-green-deep/75">Non siamo riusciti a caricare i progetti. Riprova tra poco.</p>
      ) : projects === null ? (
        <p className="text-tv-green-deep/75" data-testid="progetti-loading">Caricamento…</p>
      ) : projects.length === 0 ? (
        <p className="text-tv-green-deep/75">I progetti arrivano presto.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6" data-testid="progetti-griglia">
          {projects.map((p) => {
            const Icon = iconOf(p.icon);
            const c = colorOf(p.color);
            return (
              <Link
                key={p.id}
                to={`/progetti/${p.slug}`}
                data-testid={`project-card-${p.slug}`}
                className={`${c.bg} ${c.text} group rounded-[2rem] overflow-hidden flex flex-col min-h-[260px] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-18px_rgba(5,47,23,0.45)]`}
              >
                {p.cover_url && (
                  <img src={p.cover_url} alt="" loading="lazy" className="w-full h-44 md:h-52 object-cover" />
                )}
                <div className="p-7 md:p-8 flex flex-col grow">
                  <div className="flex items-center justify-between gap-3">
                    <Icon size={32} strokeWidth={2.2} aria-hidden="true" />
                    {p.tag && <span className="text-xs font-bold uppercase tracking-wider text-right">{p.tag}</span>}
                  </div>
                  <h2 className="mt-6 font-display font-black text-2xl md:text-3xl leading-tight">{p.title}</h2>
                  {p.summary && <p className="mt-2 text-sm md:text-base leading-snug">{p.summary}</p>}
                  <span className="mt-auto pt-6 inline-flex items-center gap-2 font-bold text-sm">
                    Scopri il progetto
                    <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Shell>
  );
};

// ---------- Pagina di un progetto: /progetti/:slug ----------
export const ProgettoDettaglio = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(undefined); // undefined = sta caricando, null = non esiste
  const [others, setOthers] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let alive = true;
    setProject(undefined);
    axios.get(`${API}/projects/${encodeURIComponent(slug)}`)
      .then((r) => { if (alive) setProject(r.data); })
      .catch(() => { if (alive) setProject(null); });
    axios.get(`${API}/projects`).then((r) => { if (alive) setOthers(r.data.filter((p) => p.slug !== slug)); }).catch(() => {});
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!project) return undefined;
    const previous = document.title;
    document.title = `${project.title} — APS Trama Viva`;
    return () => { document.title = previous; };
  }, [project]);

  useEffect(() => {
    if (!project || !(project.event_categories || []).length) { setEvents([]); return undefined; }
    let alive = true;
    axios.get(`${API}/events`).then((r) => {
      if (!alive) return;
      setEvents(
        r.data
          .filter((e) => project.event_categories.includes(e.category) && !isPast(e.date))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 6)
      );
    }).catch(() => {});
    return () => { alive = false; };
  }, [project]);

  if (project === undefined) {
    return <Shell><p className="text-tv-green-deep/75" data-testid="progetto-loading">Caricamento…</p></Shell>;
  }
  if (project === null) {
    return (
      <Shell>
        <h1 className="font-display font-black text-4xl text-tv-green-deep">Progetto non trovato</h1>
        <p className="mt-3 text-tv-green-deep/75">Forse l'indirizzo è sbagliato o il progetto non è più online.</p>
        <Link to="/progetti" className="mt-6 inline-flex items-center gap-2 font-bold text-tv-green-deep underline">
          <ArrowLeft size={16} aria-hidden="true" /> Tutti i progetti
        </Link>
      </Shell>
    );
  }

  const Icon = iconOf(project.icon);
  const c = colorOf(project.color);
  const topics = (project.topics || []).filter((t) => t.title || t.text || t.image_url);

  return (
    <Shell>
      <Link
        to="/progetti"
        data-testid="progetto-back-link"
        className="inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep/70 hover:text-tv-green-deep mb-8"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Tutti i progetti
      </Link>

      {/* Copertina */}
      <section className={`${c.bg} ${c.text} rounded-[2.5rem] overflow-hidden grid ${project.cover_url ? "md:grid-cols-2" : ""}`}>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className={`w-12 h-12 rounded-2xl ${c.chip} flex items-center justify-center`}>
              <Icon size={26} strokeWidth={2.2} aria-hidden="true" />
            </span>
            {project.tag && <span className="text-xs font-bold uppercase tracking-wider">{project.tag}</span>}
          </div>
          <h1 className="mt-6 font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95]">{project.title}</h1>
          {project.summary && <p className="mt-5 text-base md:text-lg max-w-xl leading-snug">{project.summary}</p>}
        </div>
        {project.cover_url && (
          <img src={project.cover_url} alt="" className="w-full h-64 md:h-full min-h-[280px] object-cover" />
        )}
      </section>

      {/* Introduzione */}
      {(project.intro_title || project.intro_text) && (
        <section className="mt-14 md:mt-20 max-w-3xl">
          {project.intro_title && (
            <h2 className="font-display font-black text-3xl md:text-4xl leading-tight text-tv-green-deep">{project.intro_title}</h2>
          )}
          <div className="mt-5 space-y-4 text-tv-green-deep/85 text-base md:text-lg leading-relaxed">
            {paragraphs(project.intro_text).map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        </section>
      )}

      {/* Argomenti */}
      {topics.length > 0 && (
        <section className="mt-14 md:mt-20 space-y-14 md:space-y-20" data-testid="progetto-argomenti">
          {topics.map((t, i) => (
            <article key={t.id} className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {t.image_url && (
                <img
                  src={t.image_url}
                  alt={t.image_alt || ""}
                  loading="lazy"
                  className={`w-full h-72 md:h-96 object-cover rounded-[2rem] ${i % 2 ? "md:order-2" : ""}`}
                />
              )}
              <div className={t.image_url ? "" : "md:col-span-2 max-w-3xl"}>
                {t.title && <h3 className="font-display font-black text-2xl md:text-3xl leading-tight text-tv-green-deep">{t.title}</h3>}
                <div className="mt-4 space-y-3 text-tv-green-deep/85 leading-relaxed">
                  {paragraphs(t.text).map((p, k) => <p key={k} className="whitespace-pre-line">{p}</p>)}
                </div>
                {isHttp(t.link_url) && (
                  <a
                    href={t.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/85 transition-colors"
                  >
                    {t.link_label || "Scopri di più"}
                    <ExternalLink size={14} aria-hidden="true" />
                    <span className="sr-only">(si apre in una nuova scheda)</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Prossimi appuntamenti */}
      <section className="mt-16 md:mt-24" data-testid="progetto-eventi">
        <h2 className="font-display font-black text-2xl md:text-3xl text-tv-green-deep">Prossimi appuntamenti</h2>
        {events.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <Link
                key={ev.id}
                to={`/eventi/${ev.slug || ev.id}`}
                className="bg-white rounded-2xl border border-tv-green-deep/10 p-5 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="font-display font-black text-lg leading-tight text-tv-green-deep">{ev.title}</div>
                <div className="mt-3 flex items-center gap-2 text-sm text-tv-green-deep/75">
                  <CalendarIcon size={14} aria-hidden="true" /> {fmtDate(ev.date)}{ev.time ? ` · ${ev.time}` : ""}
                </div>
                {ev.location && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-tv-green-deep/75">
                    <MapPin size={14} aria-hidden="true" /> {ev.location}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-tv-green-deep/75">Al momento non ci sono appuntamenti in programma per questo progetto.</p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/#eventi" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-white text-tv-green-deep border border-tv-green-deep/15 hover:bg-tv-sky/30 transition-colors">
            Tutti gli eventi <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <Link to="/iscrizione" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/85 transition-colors">
            Diventa socio <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Altri progetti */}
      {others.length > 0 && (
        <section className="mt-16 md:mt-24" aria-labelledby="altri-progetti">
          <h2 id="altri-progetti" className="text-xs font-bold uppercase tracking-[0.3em] text-tv-green-deep/75">Scopri anche</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {others.map((p) => {
              const OIcon = iconOf(p.icon);
              return (
                <Link
                  key={p.id}
                  to={`/progetti/${p.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-white text-tv-green-deep border border-tv-green-deep/10 hover:bg-tv-sky/30 transition-colors"
                >
                  <OIcon size={15} aria-hidden="true" /> {p.title}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </Shell>
  );
};

export default ProgettiPage;
