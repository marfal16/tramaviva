import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Film, Calendar, ArrowRight, Star, Plus, ThumbsUp, X, MessageCircle, Play, ExternalLink } from "lucide-react";
import { AvgStars } from "./LibroDettaglio";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WHATSAPP_CINEFORUM = "https://chat.whatsapp.com/IXeTAXUIfdK54NiJEaO7Pt";

const FILM_GENRES = [
  "Azione", "Avventura", "Animazione", "Commedia", "Commedia romantica",
  "Drammatico", "Fantasy", "Fantascienza", "Horror", "Thriller",
  "Giallo / Noir", "Storico", "Biografico / Documentario", "Western",
  "Musical", "Guerra", "Romantico", "Arte / Surrealismo",
  "Cult", "Classico", "Cinema del mondo", "Altro",
];

const fmtDay = (iso) => {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
};

const fmtMonthYear = (iso) => {
  if (!iso) return "";
  try { return new Date(iso + "-01").toLocaleDateString("it-IT", { month: "long", year: "numeric" }); }
  catch { return iso; }
};

const getUpcomingMonths = (count = 7) => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
};

const getNextMonthTitle = () => {
  try {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("it-IT", { month: "long" });
  } catch { return null; }
};

const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
};

const splitTopics = (text) =>
  text ? text.split(";").map((t) => t.trim()).filter(Boolean) : [];

// ── Trailer cinematico (grande, espandibile al click) ────────────────────────
const TrailerSection = ({ trailerUrl, coverUrl, title }) => {
  const [showEmbed, setShowEmbed] = useState(false);
  const ytId = getYouTubeId(trailerUrl);

  if (showEmbed && ytId) {
    return (
      <div className="rounded-2xl overflow-hidden bg-black aspect-video">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title={title ? `Trailer — ${title}` : "Trailer"}
        />
      </div>
    );
  }

  if (showEmbed && !ytId) {
    return (
      <a href={trailerUrl} target="_blank" rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-tv-sky text-white text-sm font-black hover:bg-tv-sky/80 transition-colors">
        <ExternalLink size={14} /> Apri trailer
      </a>
    );
  }

  return (
    <div
      onClick={() => setShowEmbed(true)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-video bg-tv-green-deep"
    >
      {coverUrl && (
        <img src={coverUrl} alt={title || ""}
          className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-25 transition-opacity" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          <Play size={26} className="text-white ml-1" fill="white" />
        </div>
        <span className="text-white font-black text-xs uppercase tracking-widest opacity-90">Guarda il trailer</span>
      </div>
    </div>
  );
};

const SectionHeading = ({ dot, label, title, sub, labelSize = "text-xs" }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className={`${labelSize} font-black uppercase tracking-widest text-tv-green-deep/50`}>{label}</span>
    </div>
    <h2 className="font-display font-black text-3xl md:text-4xl text-tv-green-deep leading-tight">{title}</h2>
    {sub && <p className="mt-2 text-tv-green-deep/60">{sub}</p>}
  </div>
);

// ── Modal dettaglio film (scheda completa) ──────────────────────────────────
const FilmDetailModal = ({ film, filmReviews, events = [], onClose }) => {
  const evMap = Object.fromEntries(events.map((e) => [e.id, e]));
  const linked = (film.linked_event_ids || []).map((id) => evMap[id]).filter(Boolean);
  const topics = splitTopics(film.discussion_topics);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header cinematico */}
        <div className="relative bg-tv-green-deep rounded-t-[2rem] overflow-hidden">
          {film.cover_url && (
            <div
              className="absolute inset-0 opacity-10 scale-110"
              style={{
                backgroundImage: `url(${film.cover_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(20px)",
              }}
            />
          )}
          <div className="relative z-10 p-6 pr-14">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex gap-5">
              {film.cover_url ? (
                <img src={film.cover_url} alt={film.title} className="w-24 h-36 object-cover rounded-2xl shadow-lg shrink-0" />
              ) : (
                <div className="w-24 h-36 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  <Film size={32} className="text-white/20" />
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                {film.status === "in_visione" && (
                  <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tv-sky/30 text-tv-sky text-[9px] font-black uppercase tracking-wider">
                    <Film size={7} /> In visione
                  </div>
                )}
                <h2 className="font-display font-black text-xl text-white leading-tight">{film.title}</h2>
                <div className="text-sm text-white/60 mt-1">{film.director}</div>
                {film.genre && <div className="text-xs text-white/40 italic mt-0.5">{film.genre}</div>}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-white/35">
                  {film.year && <span>{film.year}</span>}
                  {film.duration && <span>{film.duration} min</span>}
                  {film.screening_month && (
                    <span className="flex items-center gap-1">
                      <Calendar size={9} /> {fmtMonthYear(film.screening_month)}
                    </span>
                  )}
                </div>
                {filmReviews.length > 0 && (
                  <div className="mt-2"><AvgStars reviews={filmReviews} /></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 grid gap-5">

          {/* Trailer */}
          {film.trailer_url && (
            <TrailerSection trailerUrl={film.trailer_url} coverUrl={film.cover_url} title={film.title} />
          )}

          {/* Trama */}
          {film.description && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">Trama</div>
              <p className="text-sm text-tv-green-deep/70 leading-relaxed">{film.description}</p>
            </div>
          )}

          {/* Temi di discussione (splittati per ";") */}
          {topics.length > 0 && (
            <div className="rounded-2xl bg-tv-green-deep p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageCircle size={12} className="text-tv-sky shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-tv-sky">Temi di discussione</span>
              </div>
              <ul className="grid gap-2">
                {topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-tv-cream/85 text-sm">
                    <span className="text-tv-sky mt-0.5 shrink-0">▸</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critica esterna */}
          {film.external_reviews?.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">Cosa dice la critica</div>
              <div className="flex flex-wrap gap-2">
                {film.external_reviews.map((r, i) => (
                  r.url ? (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-green-deep/5 border border-tv-green-deep/10 hover:border-tv-sky/40 hover:bg-tv-sky/5 transition-colors group">
                      <Star size={10} className="text-tv-orange fill-tv-orange" />
                      <span className="text-xs font-black text-tv-green-deep">{r.score}</span>
                      <span className="text-[10px] text-tv-green-deep/50 group-hover:text-tv-sky transition-colors">— {r.source}</span>
                      <ExternalLink size={9} className="text-tv-green-deep/30 group-hover:text-tv-sky transition-colors" />
                    </a>
                  ) : (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-green-deep/5 border border-tv-green-deep/10">
                      <Star size={10} className="text-tv-orange fill-tv-orange" />
                      <span className="text-xs font-black text-tv-green-deep">{r.score}</span>
                      <span className="text-[10px] text-tv-green-deep/50">— {r.source}</span>
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          {/* La nostra visione */}
          {film.recensione && (
            <div className="rounded-2xl bg-tv-mint/40 border-l-4 border-tv-sky p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">La nostra visione</div>
              <p className="text-sm text-tv-green-deep/80 leading-relaxed">{film.recensione}</p>
            </div>
          )}

          {/* Serata collegata */}
          {linked.length > 0 && (
            <div className="pt-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">Serata collegata</div>
              {linked.map((ev) => (
                <Link key={ev.id} to={`/eventi/${ev.slug || ev.id}`} onClick={onClose}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-green-deep/5 border border-tv-green-deep/10 text-xs font-bold text-tv-green-deep hover:border-tv-bordeaux/30 hover:text-tv-bordeaux transition-colors">
                  <Calendar size={11} /> {ev.title} <ArrowRight size={10} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Card film semplificata (click per aprire dettaglio) ─────────────────────
const FilmCard = ({ film, reviewsByFilm, events = [] }) => {
  const [showDetail, setShowDetail] = useState(false);
  const filmReviews = reviewsByFilm[film.id] || [];

  return (
    <>
      <article
        onClick={() => setShowDetail(true)}
        className="bg-white rounded-[2rem] border border-tv-green-deep/8 flex items-center gap-4 p-4 hover:shadow-[0_6px_24px_-8px_rgba(5,47,23,0.14)] transition-all cursor-pointer group"
      >
        {/* Poster */}
        <div className="shrink-0 w-14 h-20">
          {film.cover_url ? (
            <img src={film.cover_url} alt={film.title} className="w-full h-full object-cover rounded-xl shadow" />
          ) : (
            <div className="w-full h-full rounded-xl bg-tv-green-deep/8 flex items-center justify-center">
              <Film size={20} className="text-tv-green-deep/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {film.status === "in_visione" && (
            <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tv-sky/15 text-tv-sky text-[9px] font-black uppercase tracking-wider">
              <Film size={7} /> In visione
            </div>
          )}
          <h3 className="font-display font-black text-base leading-tight text-tv-green-deep group-hover:text-tv-bordeaux transition-colors line-clamp-2">
            {film.title}
          </h3>
          <div className="text-sm text-tv-green-deep/55 mt-0.5 truncate">
            {film.director}{film.genre && <span className="italic"> · {film.genre}</span>}
          </div>
          {filmReviews.length > 0 && (
            <div className="mt-1.5"><AvgStars reviews={filmReviews} /></div>
          )}
        </div>

        <ArrowRight size={15} className="text-tv-green-deep/20 group-hover:text-tv-bordeaux transition-colors shrink-0" />
      </article>

      {showDetail && (
        <FilmDetailModal
          film={film}
          filmReviews={filmReviews}
          events={events}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
};

// ── Form proposta film ───────────────────────────────────────────────────────
const ProposalForm = ({ currentMonth, onSubmit, onClose }) => {
  const defaultMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const next = d.toISOString().slice(0, 7);
    return getUpcomingMonths().includes(currentMonth) ? currentMonth : next;
  })();
  const [form, setForm] = useState({
    title: "", director: "", genre: "", cover_url: "", description: "",
    trailer_url: "", discussion_topics: "", external_reviews: [],
    proposed_month: defaultMonth, nome: "", cognome: "", in_community_whatsapp: null,
  });
  const [sending, setSending] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.director.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/film-proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          director: form.director.trim(),
          genre: form.genre.trim() || null,
          cover_url: form.cover_url.trim() || null,
          description: form.description.trim() || null,
          trailer_url: form.trailer_url.trim() || null,
          discussion_topics: form.discussion_topics.trim() || null,
          external_reviews: (form.external_reviews || []).filter(r => r.source?.trim()),
          proposed_month: form.proposed_month || currentMonth,
          nome: form.nome.trim() || null,
          cognome: form.cognome.trim() || null,
          in_community_whatsapp: form.in_community_whatsapp,
        }),
      });
      if (!res.ok) throw new Error();
      onSubmit();
      onClose();
    } catch { alert("Errore nell'invio. Riprova."); }
    finally { setSending(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-sky outline-none text-tv-green-deep text-sm";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-tv-green-deep/10">
          <h2 className="font-display font-black text-xl text-tv-green-deep">Proponi un film</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-green-deep/10"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Il tuo nome *</div>
              <input className={fieldClass} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="es. Maria" required />
            </label>
            <label>
              <div className={labelClass}>Il tuo cognome *</div>
              <input className={fieldClass} value={form.cognome} onChange={(e) => set("cognome", e.target.value)} placeholder="es. Rossi" required />
            </label>
          </div>
          <div>
            <div className={labelClass}>Sei nella community WhatsApp del Cineforum? *</div>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer transition-colors text-sm font-bold ${form.in_community_whatsapp === true ? "bg-tv-sky/15 border-tv-sky text-tv-green-deep" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
                <input type="radio" name="whatsapp" className="hidden" onChange={() => set("in_community_whatsapp", true)} />
                ✅ Sì
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer transition-colors text-sm font-bold ${form.in_community_whatsapp === false ? "bg-tv-bordeaux/10 border-tv-bordeaux/30 text-tv-bordeaux" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
                <input type="radio" name="whatsapp" className="hidden" onChange={() => set("in_community_whatsapp", false)} />
                ❌ No
              </label>
            </div>
          </div>
          {form.in_community_whatsapp === false && (
            <div className="rounded-2xl bg-tv-bordeaux/10 border border-tv-bordeaux/25 p-4 grid gap-3">
              <p className="text-sm font-bold text-tv-green-deep">
                🔒 Solo i membri della community WhatsApp possono proporre film.
              </p>
              <p className="text-xs text-tv-green-deep/60">Unisciti al gruppo e poi torna qui per fare la tua proposta!</p>
              <a
                href={WHATSAPP_CINEFORUM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#25D366]/80 transition-colors self-start"
              >
                <MessageCircle size={15} /> Unisciti alla community
              </a>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Titolo film *</div>
              <input className={fieldClass} value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </label>
            <label>
              <div className={labelClass}>Regista *</div>
              <input className={fieldClass} value={form.director} onChange={(e) => set("director", e.target.value)} required />
            </label>
          </div>
          <label>
            <div className={labelClass}>Genere</div>
            <select className={fieldClass} value={form.genre} onChange={(e) => set("genre", e.target.value)}>
              <option value="">— Seleziona un genere —</option>
              {FILM_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>
            <div className={labelClass}>URL locandina (opzionale)</div>
            <input className={fieldClass} value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." />
          </label>
          <label>
            <div className={labelClass}>Breve descrizione / trama</div>
            <textarea className={`${fieldClass} resize-none`} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label>
            <div className={labelClass}>Trailer (URL YouTube, opzionale)</div>
            <input className={fieldClass} value={form.trailer_url} onChange={(e) => set("trailer_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </label>
          <label>
            <div className={labelClass}>Temi di discussione (opzionale)</div>
            <textarea className={`${fieldClass} resize-none`} rows={2} value={form.discussion_topics} onChange={(e) => set("discussion_topics", e.target.value)}
              placeholder="Es. Identità e cambiamento; Il peso dei sogni; La figura paterna — separa i temi con ;" />
          </label>
          <div>
            <div className={labelClass}>Critica esterna (opzionale)</div>
            {(form.external_reviews || []).map((r, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={r.source || ""} onChange={(e) => { const arr = [...(form.external_reviews || [])]; arr[i] = { ...arr[i], source: e.target.value }; set("external_reviews", arr); }}
                  className={`${fieldClass} w-1/3`} placeholder="Fonte" />
                <input value={r.score || ""} onChange={(e) => { const arr = [...(form.external_reviews || [])]; arr[i] = { ...arr[i], score: e.target.value }; set("external_reviews", arr); }}
                  className={`${fieldClass} w-1/5`} placeholder="8/10" />
                <input value={r.url || ""} onChange={(e) => { const arr = [...(form.external_reviews || [])]; arr[i] = { ...arr[i], url: e.target.value }; set("external_reviews", arr); }}
                  className={`${fieldClass} flex-1`} placeholder="https://..." />
                <button type="button" onClick={() => set("external_reviews", (form.external_reviews || []).filter((_, j) => j !== i))}
                  className="px-3 text-tv-bordeaux/60 hover:text-tv-bordeaux">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => set("external_reviews", [...(form.external_reviews || []), { source: "", score: "", url: "" }])}
              className="text-xs text-tv-sky font-bold">+ Aggiungi recensione esterna</button>
          </div>
          <label>
            <div className={labelClass}>Mese di riferimento *</div>
            <select className={fieldClass} value={form.proposed_month} onChange={(e) => set("proposed_month", e.target.value)} required>
              {getUpcomingMonths().map((m) => (
                <option key={m} value={m}>{fmtMonthYear(m)}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
            <button type="submit" disabled={sending || form.in_community_whatsapp === false} className="flex-1 px-4 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm disabled:opacity-60">
              {sending ? "Invio…" : "Proponi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal voto (raccoglie nome/cognome/whatsapp) ──────────────────────────────
const VoteModal = ({ proposal, onVote, onUnvote, onClose }) => {
  const [form, setForm] = useState({ nome: "", cognome: "", in_community_whatsapp: null });
  const [sending, setSending] = useState(false);
  const [duplicateOf, setDuplicateOf] = useState(null);
  const [unvoteError, setUnvoteError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUnvote = async () => {
    setSending(true);
    setUnvoteError(null);
    try {
      await onUnvote(proposal.id, { nome: form.nome.trim(), cognome: form.cognome.trim() });
      onClose();
    } catch (err) {
      setUnvoteError(err?.message || "Errore nella rimozione del voto.");
    } finally { setSending(false); }
  };

  const vote = async (force = false) => {
    setSending(true);
    try {
      await onVote(proposal.id, { nome: form.nome.trim(), cognome: form.cognome.trim(), in_community_whatsapp: form.in_community_whatsapp }, force);
      onClose();
    } catch (err) {
      if (err?.isDuplicate) setDuplicateOf(err.duplicateName);
    } finally { setSending(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.cognome.trim()) return;
    await vote(false);
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-sky outline-none text-tv-green-deep text-sm";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-tv-green-deep/60 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-tv-green-deep/10">
          <span className="font-bold text-tv-green-deep text-base">Vota «{proposal.title}»</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-tv-green-deep/10"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 grid gap-3">
          {duplicateOf && (
            <div className="rounded-2xl bg-tv-orange/10 border border-tv-orange/30 p-4 grid gap-3">
              <p className="text-sm font-bold text-tv-green-deep">
                ⚠️ È già stato registrato un voto a nome <span className="text-tv-bordeaux">{duplicateOf}</span>.
              </p>
              {unvoteError && (
                <div className="rounded-xl bg-tv-bordeaux/10 border border-tv-bordeaux/20 p-2 text-xs text-tv-bordeaux">{unvoteError}</div>
              )}
              <div className="grid gap-2">
                <button type="button" onClick={handleUnvote} disabled={sending} className="w-full px-3 py-2 rounded-full bg-tv-green-deep text-tv-cream font-bold text-xs disabled:opacity-60">
                  {sending ? "…" : "Rimuovi il mio voto"}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDuplicateOf(null)} className="flex-1 px-3 py-2 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-xs">
                    Annulla
                  </button>
                  <button type="button" onClick={() => vote(true)} disabled={sending} className="flex-1 px-3 py-2 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-xs disabled:opacity-60">
                    {sending ? "…" : "Sono un omonimo"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!duplicateOf && (
            <>
              <p className="text-xs text-tv-green-deep/50">Lascia il tuo nome per registrare il voto.</p>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <div className={labelClass}>Nome *</div>
                  <input className={fieldClass} value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Maria" required />
                </label>
                <label>
                  <div className={labelClass}>Cognome *</div>
                  <input className={fieldClass} value={form.cognome} onChange={(e) => set("cognome", e.target.value)} placeholder="Rossi" required />
                </label>
              </div>
              <div>
                <div className={labelClass}>Sei nella community WhatsApp?</div>
                <div className="flex gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${form.in_community_whatsapp === true ? "bg-tv-sky/15 border-tv-sky text-tv-green-deep" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
                    <input type="radio" name="wv" className="hidden" onChange={() => set("in_community_whatsapp", true)} /> ✅ Sì
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${form.in_community_whatsapp === false ? "bg-tv-bordeaux/10 border-tv-bordeaux/30 text-tv-bordeaux" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
                    <input type="radio" name="wv" className="hidden" onChange={() => set("in_community_whatsapp", false)} /> ❌ No
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
                <button type="submit" disabled={sending} className="flex-1 px-4 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-1.5">
                  <ThumbsUp size={13} /> {sending ? "…" : "Vota!"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};


// ── Modal dettaglio proposta film ────────────────────────────────────────────
const FilmProposalDetailModal = ({ proposal, onVoteRequest, onClose }) => {
  const initials = [proposal.nome?.[0], proposal.cognome?.[0]].filter(Boolean).join("").toUpperCase();
  const topics = splitTopics(proposal.discussion_topics);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header con poster */}
        <div className="relative bg-tv-green-deep rounded-t-[2rem] overflow-hidden">
          {proposal.cover_url && (
            <div
              className="absolute inset-0 opacity-10 scale-110"
              style={{
                backgroundImage: `url(${proposal.cover_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(20px)",
              }}
            />
          )}
          <div className="relative z-10 p-6 pr-14">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X size={18} />
            </button>
            <div className="mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Proposta del mese</span>
            </div>
            <div className="flex gap-5">
              {proposal.cover_url ? (
                <img src={proposal.cover_url} alt={proposal.title} className="w-24 h-36 object-cover rounded-2xl shadow-lg shrink-0" />
              ) : (
                <div className="w-24 h-36 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  <Film size={32} className="text-white/20" />
                </div>
              )}
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-display font-black text-xl text-white leading-tight">{proposal.title}</h3>
                <div className="text-sm text-white/60 mt-1">
                  {proposal.director}{proposal.genre && <span className="italic text-white/40"> · {proposal.genre}</span>}
                </div>
                {initials && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-tv-bordeaux/80 text-tv-cream flex items-center justify-center text-[10px] font-black shrink-0">{initials}</div>
                    <span className="text-xs text-white/40">{[proposal.nome, proposal.cognome].filter(Boolean).join(" ")}</span>
                  </div>
                )}
                <div className="mt-4">
                  <button
                    onClick={onVoteRequest}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors bg-tv-orange text-tv-green-deep hover:bg-tv-orange/80"
                  >
                    <ThumbsUp size={14} /> Vota · {proposal.votes}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-6 grid gap-5">
          {/* Trailer */}
          {proposal.trailer_url && (
            <TrailerSection trailerUrl={proposal.trailer_url} coverUrl={proposal.cover_url} title={proposal.title} />
          )}

          {proposal.description && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">Trama</div>
              <p className="text-sm text-tv-green-deep/70 leading-relaxed">{proposal.description}</p>
            </div>
          )}

          {/* Temi di discussione splittati per ";" */}
          {topics.length > 0 && (
            <div className="rounded-2xl bg-tv-green-deep p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageCircle size={11} className="text-tv-sky shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-tv-sky">Temi di discussione</span>
              </div>
              <ul className="grid gap-2">
                {topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-tv-cream/85 text-xs">
                    <span className="text-tv-sky mt-0.5 shrink-0">▸</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critica esterna */}
          {proposal.external_reviews?.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">Cosa dice la critica</div>
              <div className="flex flex-wrap gap-2">
                {proposal.external_reviews.map((r, i) => (
                  r.url ? (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-green-deep/5 border border-tv-green-deep/10 hover:border-tv-sky/40 hover:bg-tv-sky/5 transition-colors group">
                      <Star size={10} className="text-tv-orange fill-tv-orange" />
                      <span className="text-xs font-black text-tv-green-deep">{r.score}</span>
                      <span className="text-[10px] text-tv-green-deep/50 group-hover:text-tv-sky transition-colors">— {r.source}</span>
                      <ExternalLink size={9} className="text-tv-green-deep/30 group-hover:text-tv-sky transition-colors" />
                    </a>
                  ) : (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-green-deep/5 border border-tv-green-deep/10">
                      <Star size={10} className="text-tv-orange fill-tv-orange" />
                      <span className="text-xs font-black text-tv-green-deep">{r.score}</span>
                      <span className="text-[10px] text-tv-green-deep/50">— {r.source}</span>
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Card proposta film nella griglia ─────────────────────────────────────────
const FilmProposalCard = ({ proposal, onVote, onUnvote }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const initials = [proposal.nome?.[0], proposal.cognome?.[0]].filter(Boolean).join("").toUpperCase();

  return (
    <>
      <div className="flex flex-col rounded-[2rem] bg-white border border-tv-green-deep/8 overflow-hidden hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.12)] transition-shadow cursor-pointer group"
           onClick={() => setShowDetail(true)}>
        {/* Cover */}
        <div className="relative bg-tv-green-deep/5">
          {proposal.cover_url ? (
            <img src={proposal.cover_url} alt={proposal.title}
                 className="w-full h-52 object-cover group-hover:scale-[1.02] transition-transform duration-300" />
          ) : (
            <div className="w-full h-52 flex items-center justify-center">
              <Film size={40} className="text-tv-green-deep/15" />
            </div>
          )}
          {/* Vote badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-sm bg-white/90 text-tv-green-deep/70">
            <ThumbsUp size={11} /> {proposal.votes}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          <div>
            <div className="font-display font-black text-base leading-tight text-tv-green-deep group-hover:text-tv-bordeaux transition-colors line-clamp-2">
              {proposal.title}
            </div>
            <div className="text-sm text-tv-green-deep/55 mt-0.5 truncate">
              {proposal.director}{proposal.genre && <span className="italic"> · {proposal.genre}</span>}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            {initials ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-tv-bordeaux/80 text-tv-cream flex items-center justify-center text-[9px] font-black shrink-0">{initials}</div>
                <span className="text-xs text-tv-green-deep/35 truncate">{[proposal.nome, proposal.cognome].filter(Boolean).join(" ")}</span>
              </div>
            ) : <span />}
            <span />
          </div>
        </div>
      </div>

      {showDetail && !showVoteModal && (
        <FilmProposalDetailModal
          proposal={proposal}
          onVoteRequest={() => { setShowDetail(false); setShowVoteModal(true); }}
          onClose={() => setShowDetail(false)}
        />
      )}
      {showVoteModal && (
        <VoteModal
          proposal={proposal}
          onVote={onVote}
          onUnvote={onUnvote}
          onClose={() => setShowVoteModal(false)}
        />
      )}
    </>
  );
};

// ── Sezione proposte film ─────────────────────────────────────────────────────
const FilmProposalsSection = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/film-proposals?month=${selectedMonth}`)
      .then((r) => r.json())
      .then((d) => setProposals(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const [allMonths, setAllMonths] = useState([]);
  const loadAllMonths = useCallback(() => {
    fetch(`${BACKEND_URL}/api/film-proposals`)
      .then((r) => r.json())
      .then((d) => {
        const months = [...new Set((Array.isArray(d) ? d : []).map((p) => p.proposed_month))].sort().reverse();
        const next = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); })();
        if (!months.includes(next)) months.unshift(next);
        setAllMonths(months);
      })
      .catch(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); setAllMonths([d.toISOString().slice(0, 7)]); });
  }, []);
  useEffect(() => { loadAllMonths(); }, [loadAllMonths]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (id, voterInfo, force = false) => {
    const url = `${BACKEND_URL}/api/film-proposals/${id}/vote${force ? "?force=true" : ""}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voterInfo || {}),
    });
    if (res.status === 409) {
      const data = await res.json();
      const detail = data?.detail || "";
      const err = new Error("duplicate");
      err.isDuplicate = true;
      err.duplicateName = detail.startsWith("DUPLICATE:") ? detail.slice(10).trim() : "questo nome";
      throw err;
    }
    if (!res.ok) throw new Error("vote failed");
    const updated = await res.json();
    setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => b.votes - a.votes));
  };

  const handleUnvote = async (id, voterInfo) => {
    const res = await fetch(`${BACKEND_URL}/api/film-proposals/${id}/unvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voterInfo || {}),
    });
    if (!res.ok) {
      let msg = "Nessun voto trovato per questo nome. Controlla di aver scritto nome e cognome esattamente come quando hai votato.";
      try { const data = await res.json(); if (data?.detail) msg = data.detail; } catch {}
      throw new Error(msg);
    }
    const updated = await res.json();
    setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => b.votes - a.votes));
  };

  const nextMonthLabel = getNextMonthTitle();
  const nextMonthPrep = nextMonthLabel && /^[aeiouAEIOU]/.test(nextMonthLabel) ? "ad" : "a";
  const sectionTitle = nextMonthLabel ? `Cosa guardiamo ${nextMonthPrep} ${nextMonthLabel}` : "Cosa guardiamo dopo?";

  return (
    <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep/[0.03]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <SectionHeading
            dot="bg-tv-orange"
            label="Proposte del mese"
            title={sectionTitle}
            sub="Proponi un film e vota i tuoi preferiti. I più votati diventano le prossime visioni."
          />
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors shrink-0"
          >
            <Plus size={15} /> Proponi un film
          </button>
        </div>

        {/* Filtro mese */}
        {allMonths.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            {allMonths.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors ${
                  selectedMonth === m ? "bg-tv-green-deep text-tv-cream" : "bg-white border border-tv-green-deep/15 text-tv-green-deep/60 hover:bg-tv-green-deep/5"
                }`}
              >
                {fmtMonthYear(m)}
              </button>
            ))}
          </div>
        )}

        {/* Griglia proposte */}
        {loading ? (
          <div className="text-tv-green-deep/30 text-sm py-8 text-center">Caricamento…</div>
        ) : proposals.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-tv-green-deep/8 p-10 text-center text-tv-green-deep/40">
            <Film size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nessuna proposta per {fmtMonthYear(selectedMonth)}.</p>
            <p className="text-sm mt-1">Sii il primo a proporre un film!</p>
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors">
              <Plus size={14} /> Proponi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {proposals.map((p) => (
              <FilmProposalCard key={p.id} proposal={p} onVote={handleVote} onUnvote={handleUnvote} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProposalForm currentMonth={selectedMonth} onSubmit={() => { loadAllMonths(); load(); }} onClose={() => setShowForm(false)} />
      )}
    </section>
  );
};

// ── Pagina principale ────────────────────────────────────────────────────────
export const Cineforum = () => {
  const [films, setFilms] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/films`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/events`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/film-reviews`).then(r => r.json()),
    ])
      .then(([fl, ev, rv]) => {
        setFilms(Array.isArray(fl) ? fl : []);
        setEvents(Array.isArray(ev) ? ev : []);
        setReviews(Array.isArray(rv) ? rv : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reviewsByFilm = useMemo(() => {
    const map = {};
    reviews.forEach(r => { if (!map[r.film_id]) map[r.film_id] = []; map[r.film_id].push(r); });
    return map;
  }, [reviews]);

  const inVisione   = films.filter(f => f.status === "in_visione");
  const conclusi    = films.filter(f => f.status === "concluso");
  const prossimi    = films.filter(f => f.status === "prossimamente");

  return (
    <div className="bg-tv-cream">
      {/* Hero */}
      <section className="pt-32 pb-6 md:pt-40 md:pb-8 px-6 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tv-sky/90 text-white text-xs font-bold uppercase tracking-wider mb-7">
            <Film size={13} /> Cineforum · Trama Viva APS
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.93] tracking-tight text-tv-green-deep">
            Stessa sala, <span className="italic font-light text-tv-sky">sguardi diversi</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-tv-green-deep/65">
            Scegliamo un film, lo guardiamo, lo discutiamo. Dal voto dei titoli alla discussione finale, ogni proiezione è un pretesto per guardarsi — e guardare il mondo — con occhi nuovi.
          </p>
        </div>
      </section>

      {/* WhatsApp strip */}
      <div className="px-6 md:px-10 pb-6 md:pb-8">
        <div className="mx-auto max-w-5xl">
          <a href={WHATSAPP_CINEFORUM} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/15 transition-colors group">
            <MessageCircle size={18} className="text-[#25D366] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/50 mb-0.5">Community WhatsApp</div>
              <div className="text-sm font-bold text-tv-green-deep leading-tight">Unisciti al gruppo del Cineforum</div>
            </div>
            <ArrowRight size={14} className="text-tv-green-deep/30 group-hover:translate-x-0.5 transition-transform shrink-0 ml-auto" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-tv-green-deep/40 py-24">Caricamento…</div>
      ) : (
        <>
          {/* In visione */}
          {inVisione.length > 0 && (
            <section className="pt-4 pb-14 md:pt-6 md:pb-20 px-6 md:px-10">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-sky" label="Ora in corso" title="Stiamo guardando" labelSize="text-sm" />
                <div className="grid md:grid-cols-2 gap-4">
                  {inVisione.map(f => <FilmCard key={f.id} film={f} reviewsByFilm={reviewsByFilm} events={events} />)}
                </div>
              </div>
            </section>
          )}

          {/* Proposte del mese */}
          <FilmProposalsSection />

          {/* Archivio */}
          {conclusi.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-bordeaux" label="Archivio" title="Film visti" sub="I film che abbiamo guardato e discusso insieme." />
                <div className="grid md:grid-cols-2 gap-4">
                  {conclusi.map(f => <FilmCard key={f.id} film={f} reviewsByFilm={reviewsByFilm} events={events} />)}
                </div>
              </div>
            </section>
          )}

          {/* Prossimamente */}
          {prossimi.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep/[0.03]">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-orange" label="In arrivo" title="Prossime proiezioni selezionate" />
                <div className="grid md:grid-cols-2 gap-4">
                  {prossimi.map(f => <FilmCard key={f.id} film={f} reviewsByFilm={reviewsByFilm} events={events} />)}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

// ── Card cineforum per la sezione "I nostri club" in home ─────────────────────
export const CineforumTeaser = () => {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/films`)
      .then(r => r.json())
      .then(fl => {
        const films = Array.isArray(fl) ? fl : [];
        setCurrent(films.find(f => f.status === "in_visione") || null);
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      to="/cineforum"
      className="group flex flex-col rounded-[2rem] bg-white border border-tv-green-deep/10 overflow-hidden hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.12)] hover:border-tv-green-deep/20 transition-all"
    >
      <div className="h-1.5 bg-gradient-to-r from-tv-sky to-tv-sky/60" />
      <div className="p-6 flex-1 flex flex-col gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">
            <Film size={11} /> Cineforum
          </div>
          <p className="text-sm text-tv-green-deep/55 leading-relaxed">
            Ogni mese un film, una serata insieme. Si guarda, si discute, si condivide — un frame alla volta.
          </p>
        </div>

        {current ? (
          <div className="flex gap-3 items-start rounded-2xl bg-tv-green-deep/[0.04] p-3">
            {current.cover_url ? (
              <img src={current.cover_url} alt={current.title} className="w-10 h-14 object-cover rounded-xl shrink-0 shadow-sm" />
            ) : (
              <div className="w-10 h-14 rounded-xl bg-tv-green-deep/10 flex items-center justify-center shrink-0">
                <Film size={16} className="text-tv-green-deep/30" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/35 mb-0.5">Stiamo guardando</div>
              <div className="font-bold text-tv-green-deep text-sm leading-tight truncate">{current.title}</div>
              <div className="text-xs text-tv-green-deep/50 mt-0.5 truncate">{current.director}</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-tv-green-deep/[0.04] p-3 text-xs text-tv-green-deep/35 italic">
            Nessuna proiezione attiva — vota i tuoi film del mese!
          </div>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between">
          <span className="text-xs text-tv-green-deep/35">Proposte · Recensioni · Proiezioni</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-tv-green-deep group-hover:text-tv-sky transition-colors">
            Entra nel cineforum <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default Cineforum;
