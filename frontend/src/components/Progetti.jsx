import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import {
  Wine, Mountain, Stethoscope, Laptop, Heart, Palette, Users, Sparkles,
  ArrowLeft, ArrowRight, ExternalLink, Calendar as CalendarIcon, MapPin, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { isPast } from "./Eventi";
import { cdnThumb } from "../lib/imageTools";

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

// ---------- Foto degli eventi passati del progetto ----------
// Mosaico a 4 colonne (2 su telefono) con tessere di misure diverse. Le foto arrivano a gruppi di 6: ogni gruppo
// ha una composizione che riempie le righe senza buchi, anche se l'ultimo gruppo è incompleto.
const PHOTOS_PER_STEP = 6;
const TILE = {
  big: "lg:col-span-2 lg:row-span-2",
  one: "lg:col-span-1",
  wide: "lg:col-span-2",
  full: "lg:col-span-4",
};
const PATTERNS = {
  1: ["full"],
  2: ["wide", "wide"],
  3: ["big", "wide", "wide"],
  4: ["big", "one", "one", "wide"],
  5: ["big", "one", "one", "wide", "full"],
  6: ["big", "one", "one", "wide", "wide", "wide"],
};

// Classi di ogni foto: su telefono la prima del gruppo (e l'ultima, se resterebbe sola) occupa tutta la riga.
const tileClasses = (count, i) => {
  const mobileWide = i === 0 || (i === count - 1 && (count - 1) % 2 === 1) ? "col-span-2" : "";
  return `${mobileWide} ${TILE[PATTERNS[count][i]]}`;
};

// Le copertine più vecchie si servono dal server e arrivano come indirizzo relativo (/api/...)
const photoSrc = (url, width) =>
  cdnThumb(url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url, width);

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

const ProjectPhotos = ({ slug }) => {
  const [photos, setPhotos] = useState([]);
  const [shown, setShown] = useState(PHOTOS_PER_STEP);
  const [open, setOpen] = useState(null); // posizione della foto ingrandita

  useEffect(() => {
    let alive = true;
    setShown(PHOTOS_PER_STEP);
    setOpen(null);
    axios.get(`${API}/projects/${encodeURIComponent(slug)}/photos`)
      .then((r) => { if (alive) setPhotos(r.data); })
      .catch(() => { if (alive) setPhotos([]); });
    return () => { alive = false; };
  }, [slug]);

  // Con la finestra aperta: frecce per scorrere, la pagina sotto non scorre
  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + photos.length) % photos.length);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, photos.length]);

  if (photos.length === 0) return null;

  const visible = photos.slice(0, shown);
  const groups = [];
  for (let i = 0; i < visible.length; i += PHOTOS_PER_STEP) groups.push(visible.slice(i, i + PHOTOS_PER_STEP));
  const current = open !== null ? photos[open] : null;

  return (
    <section className="mt-16 md:mt-24" aria-labelledby="progetto-foto" data-testid="progetto-foto">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-3">Dai nostri eventi</div>
      <h2 id="progetto-foto" className="font-display font-black text-2xl md:text-3xl text-tv-green-deep">
        Momenti che abbiamo vissuto
      </h2>

      <div className="mt-6 space-y-3 md:space-y-4">
        {groups.map((group, g) => (
          <div
            key={g}
            className="grid grid-cols-2 lg:grid-cols-4 grid-flow-dense gap-3 md:gap-4 auto-rows-[140px] sm:auto-rows-[170px] lg:auto-rows-[190px]"
          >
            {group.map((p, i) => {
              const index = g * PHOTOS_PER_STEP + i;
              const label = `${p.event_title}, ${shortDate(p.event_date)}`;
              return (
                <button
                  key={`${p.url}-${index}`}
                  type="button"
                  onClick={() => setOpen(index)}
                  aria-label={`Ingrandisci la foto: ${label}`}
                  className={`${tileClasses(group.length, i)} group relative overflow-hidden rounded-2xl bg-tv-green-deep/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-tv-orange`}
                >
                  <img
                    src={photoSrc(p.url, group.length > 1 && i === 0 ? 1100 : 700)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 px-3 pt-8 pb-3 md:px-4 md:pb-4 text-left bg-gradient-to-t from-tv-green-deep/85 via-tv-green-deep/35 to-transparent text-tv-cream">
                    <span className="block font-display font-black text-sm md:text-base leading-tight line-clamp-2">{p.event_title}</span>
                    <span className="block mt-0.5 text-[11px] font-bold uppercase tracking-wider">{shortDate(p.event_date)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {photos.length > shown && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + PHOTOS_PER_STEP)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-white text-tv-green-deep border border-tv-green-deep/15 hover:bg-tv-sky/30 transition-colors"
          >
            Mostra altre foto ({photos.length - shown})
          </button>
        </div>
      )}

      {current && (
        <div className="fixed inset-0 z-[70] bg-tv-green-deep/90 backdrop-blur-sm flex flex-col items-center justify-center p-4" onClick={() => setOpen(null)}>
          <h3 className="sr-only">Foto dell'evento {current.event_title}</h3>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={(e) => { e.stopPropagation(); setOpen(null); }}
            className="absolute top-4 right-4 p-3 rounded-full bg-tv-cream text-tv-green-deep hover:bg-white"
          >
            <X size={20} aria-hidden="true" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto precedente"
                onClick={(e) => { e.stopPropagation(); setOpen((i) => (i - 1 + photos.length) % photos.length); }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-tv-cream/90 text-tv-green-deep hover:bg-white"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Foto successiva"
                onClick={(e) => { e.stopPropagation(); setOpen((i) => (i + 1) % photos.length); }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-tv-cream/90 text-tv-green-deep hover:bg-white"
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </>
          )}
          <img
            src={photoSrc(current.url, 1800)}
            alt={`Foto dell'evento ${current.event_title}, ${shortDate(current.event_date)}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[75vh] max-w-full rounded-2xl object-contain"
          />
          <div className="mt-4 text-center text-tv-cream" onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-black text-lg md:text-xl">{current.event_title}</div>
            <div className="text-xs font-bold uppercase tracking-wider">{shortDate(current.event_date)}</div>
            {current.event_slug && (
              <Link
                to={`/eventi/${current.event_slug}`}
                onClick={() => setOpen(null)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold underline underline-offset-4 hover:text-tv-mint"
              >
                Vai alla pagina dell'evento <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
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

      {/* Foto degli eventi passati */}
      <ProjectPhotos slug={project.slug} />

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
