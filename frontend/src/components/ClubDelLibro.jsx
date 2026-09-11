import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, ArrowRight, Library, Star, Plus, ThumbsUp, X, Lock, RotateCcw } from "lucide-react";
import { AvgStars } from "./LibroDettaglio";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/IXeTAXUIfdK54NiJEaO7Pt";

const BOOK_GENRES = [
  "Romanzo", "Romanzo storico", "Romanzo contemporaneo", "Romanzo rosa",
  "Giallo", "Thriller", "Mystery", "Horror",
  "Fantasy", "Fantascienza", "Avventura",
  "Classico", "Letteratura italiana", "Letteratura straniera",
  "Narrativa", "Raccolta di racconti",
  "Biografia", "Autobiografia", "Memorie",
  "Saggio", "Saggistica",
  "Self-help", "Crescita personale", "Benessere e Self-Help",
  "Psicologia", "Filosofia", "Spiritualità",
  "Storia", "Scienza", "Natura",
  "Economia", "Business",
  "Poesia", "Teatro",
  "Young Adult", "Graphic novel", "Fumetto",
  "Umorismo", "Satira",
  "Viaggio", "Arte", "Cucina",
  "Altro",
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

// ── Card libro (archivio / in lettura) ──────────────────────────────────────
const BookCard = ({ book, reviewsByBook, events = [] }) => {
  const evMap = Object.fromEntries(events.map((e) => [e.id, e]));
  const linked = (book.linked_event_ids || []).map((id) => evMap[id]).filter(Boolean);
  const bookReviews = reviewsByBook[book.id] || [];

  return (
    <article className="bg-white rounded-[2rem] border border-tv-green-deep/8 flex flex-col overflow-hidden hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.12)] transition-shadow">
      <div className="flex gap-5 p-6 flex-1">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-20 h-28 object-cover rounded-2xl shrink-0 shadow-md" />
        ) : (
          <div className="w-20 h-28 rounded-2xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
            <BookOpen size={26} className="text-tv-green-deep/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link to={`/club-del-libro/${book.id}`}>
            <h3 className="font-display font-black text-lg leading-tight text-tv-green-deep hover:text-tv-bordeaux transition-colors">{book.title}</h3>
          </Link>
          <div className="text-sm text-tv-green-deep/55 mt-0.5">
            {book.author}{book.genre && <span className="italic"> · {book.genre}</span>}
          </div>
          {book.reading_month && (
            <div className="mt-1 text-xs text-tv-green-deep/40 flex items-center gap-1">
              <Calendar size={10} /> {fmtMonthYear(book.reading_month)}
            </div>
          )}
          {bookReviews.length > 0 && <div className="mt-2"><AvgStars reviews={bookReviews} /></div>}
          {book.description && (
            <p className="mt-2 text-sm text-tv-green-deep/65 leading-relaxed line-clamp-3">{book.description}</p>
          )}
        </div>
      </div>
      {book.recensione && (
        <div className="mx-5 mb-3 rounded-2xl bg-tv-mint/40 border-l-4 border-tv-green p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-1">La nostra lettura</div>
          <p className="text-sm text-tv-green-deep/80 leading-relaxed line-clamp-3">{book.recensione}</p>
        </div>
      )}
      {linked.length > 0 && (
        <div className="px-5 pb-3">
          {linked.map((ev) => (
            <Link key={ev.id} to={`/eventi/${ev.slug || ev.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-tv-green-deep hover:text-tv-bordeaux transition-colors">
              <Calendar size={11} /> {ev.title} <ArrowRight size={10} />
            </Link>
          ))}
        </div>
      )}
      {(book.status === "concluso" || book.status === "in_lettura") && (
        <div className="px-5 pb-5 pt-1">
          <Link to={`/club-del-libro/${book.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-tv-bordeaux hover:text-tv-green-deep transition-colors group">
            <Star size={11} />
            {bookReviews.length > 0 ? `Vedi tutte le recensioni (${bookReviews.length})` : "Scrivi una recensione"}
            <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}
    </article>
  );
};

// ── Form proposta libro ──────────────────────────────────────────────────────
const CLUB_PWD_KEY = "tv_club_pwd";

const PasswordModal = ({ club, onSuccess, onClose }) => {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!pwd.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/community-library/check-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club, password: pwd.trim() }),
      });
      const d = await res.json();
      if (d.ok) { localStorage.setItem(CLUB_PWD_KEY, pwd.trim()); onSuccess(pwd.trim()); }
      else setError("Password errata. Controllala nel gruppo WhatsApp.");
    } catch { setError("Errore di connessione. Riprova."); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <Lock size={28} className="mx-auto mb-2 text-tv-green-deep/40" />
          <h2 className="font-display font-black text-xl text-tv-green-deep">Area community</h2>
          <p className="text-sm text-tv-green-deep/50 mt-1">Inserisci la password condivisa nel gruppo WhatsApp.</p>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <input type="text" autoFocus placeholder="Password…" value={pwd} onChange={e => setPwd(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" />
          {error && <p className="text-xs text-tv-bordeaux">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
            <button type="submit" disabled={loading || !pwd.trim()} className="flex-1 px-4 py-2.5 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm disabled:opacity-60">
              {loading ? "…" : "Accedi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProposalForm = ({ currentMonth, onSubmit, onClose, initialData }) => {
  const defaultMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const next = d.toISOString().slice(0, 7);
    return getUpcomingMonths().includes(currentMonth) ? currentMonth : next;
  })();
  const [form, setForm] = useState({
    title: initialData?.title || "",
    author: initialData?.author || "",
    genre: initialData?.genre || "",
    cover_url: initialData?.cover_url || "",
    description: initialData?.description || "",
    proposed_month: defaultMonth,
    nome: initialData?.nome || "",
    cognome: initialData?.cognome || "",
  });
  const [sending, setSending] = useState(false);
  const [pastProposals, setPastProposals] = useState(null);
  const [loadingPast, setLoadingPast] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadPastProposals = async () => {
    if (pastProposals !== null) { setPastProposals(null); return; }
    setLoadingPast(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/proposals`);
      const d = await res.json();
      const unique = Object.values(
        (Array.isArray(d) ? d : []).reduce((acc, p) => {
          if (!acc[p.title]) acc[p.title] = p;
          return acc;
        }, {})
      ).sort((a, b) => a.title.localeCompare(b.title));
      setPastProposals(unique);
    } catch {} finally { setLoadingPast(false); }
  };

  const pickPast = (p) => {
    setForm(f => ({ ...f, title: p.title || "", author: p.author || "", genre: p.genre || "", cover_url: p.cover_url || "", description: p.description || "" }));
    setPastProposals(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          author: form.author.trim(),
          genre: form.genre.trim() || null,
          cover_url: form.cover_url.trim() || null,
          description: form.description.trim() || null,
          proposed_month: form.proposed_month || currentMonth,
          nome: form.nome.trim() || null,
          cognome: form.cognome.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      onSubmit();
      onClose();
    } catch { alert("Errore nell'invio. Riprova."); }
    finally { setSending(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-tv-green-deep/10">
          <h2 className="font-display font-black text-xl text-tv-green-deep">{initialData ? "Riproponi libro" : "Proponi un libro"}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-green-deep/10"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 grid gap-4">
          {/* Riproponi da precedenti */}
          <div>
            <button type="button" onClick={loadPastProposals}
              className="text-xs font-bold text-tv-bordeaux hover:text-tv-green-deep transition-colors flex items-center gap-1">
              {loadingPast ? "Caricamento…" : pastProposals !== null ? "↑ Chiudi" : "↩ Seleziona da proposte precedenti"}
            </button>
            {pastProposals !== null && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-2xl border border-tv-green-deep/10 bg-white divide-y divide-tv-green-deep/6">
                {pastProposals.length === 0
                  ? <p className="text-xs text-tv-green-deep/40 p-3">Nessuna proposta trovata.</p>
                  : pastProposals.map((p) => (
                    <button key={p.id} type="button" onClick={() => pickPast(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-tv-sky/20 transition-colors">
                      <div className="text-sm font-bold text-tv-green-deep line-clamp-1">{p.title}</div>
                      <div className="text-xs text-tv-green-deep/45">{p.author}</div>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Titolo libro *</div>
              <input className={fieldClass} value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </label>
            <label>
              <div className={labelClass}>Autore *</div>
              <input className={fieldClass} value={form.author} onChange={(e) => set("author", e.target.value)} required />
            </label>
          </div>
          <label>
            <div className={labelClass}>Genere</div>
            <select className={fieldClass} value={form.genre} onChange={(e) => set("genre", e.target.value)}>
              <option value="">— Seleziona un genere —</option>
              {BOOK_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>
            <div className={labelClass}>URL copertina (opzionale)</div>
            <input className={fieldClass} value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." />
          </label>
          <label>
            <div className={labelClass}>Breve descrizione / trama</div>
            <textarea className={`${fieldClass} resize-none`} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
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
            <button type="submit" disabled={sending} className="flex-1 px-4 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm disabled:opacity-60">
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
  const [form, setForm] = useState({ nome: "", cognome: "" });
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
      await onVote(proposal.id, { nome: form.nome.trim(), cognome: form.cognome.trim() }, force);
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

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";
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


// ── Modal dettaglio proposta ─────────────────────────────────────────────────
const ProposalDetailModal = ({ proposal, onVoteRequest, onClose }) => {
  const initials = [proposal.nome?.[0], proposal.cognome?.[0]].filter(Boolean).join("").toUpperCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-tv-green-deep/10">
          <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/40">Proposta del mese</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-green-deep/10"><X size={18} /></button>
        </div>
        <div className="p-6 flex gap-5">
          {proposal.cover_url ? (
            <img src={proposal.cover_url} alt={proposal.title} className="w-28 h-40 object-cover rounded-2xl shrink-0 shadow-md" />
          ) : (
            <div className="w-28 h-40 rounded-2xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
              <BookOpen size={36} className="text-tv-green-deep/20" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-xl leading-tight text-tv-green-deep">{proposal.title}</h3>
            <div className="text-sm text-tv-green-deep/55 mt-1">
              {proposal.author}{proposal.genre && <span className="italic"> · {proposal.genre}</span>}
            </div>
            {initials && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-tv-bordeaux text-tv-cream flex items-center justify-center text-[10px] font-black shrink-0">{initials}</div>
                <span className="text-xs text-tv-green-deep/50">{[proposal.nome, proposal.cognome].filter(Boolean).join(" ")}</span>
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
        {proposal.description && (
          <div className="px-6 pb-6">
            <div className="text-xs font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">Trama</div>
            <p className="text-sm text-tv-green-deep/70 leading-relaxed">{proposal.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Card proposta nella griglia ──────────────────────────────────────────────
// ── Countdown fine votazioni ─────────────────────────────────────────────────
const VotingCountdown = ({ endsAt, onExpire }) => {
  const [now, setNow] = useState(() => new Date());
  const expiredRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const msLeft = Math.max(0, new Date(endsAt) - now);
  useEffect(() => {
    if (msLeft === 0 && !expiredRef.current && onExpire) {
      expiredRef.current = true;
      onExpire();
    }
  }, [msLeft, onExpire]);
  if (msLeft === 0) return null;
  const days = Math.floor(msLeft / 86400000);
  const hours = Math.floor((msLeft % 86400000) / 3600000);
  const minutes = Math.floor((msLeft % 3600000) / 60000);
  const seconds = Math.floor((msLeft % 60000) / 1000);
  const units = days === 0
    ? [{ v: hours, l: "hh" }, { v: minutes, l: "mm" }, { v: seconds, l: "ss" }]
    : [{ v: days, l: "gg" }, { v: hours, l: "hh" }, { v: minutes, l: "mm" }, { v: seconds, l: "ss" }];
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-tv-orange/8 border border-tv-orange/20 rounded-2xl px-5 py-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/50">⏱ Fine votazioni</span>
      <div className="flex gap-1.5">
        {units.map(({ v, l }) => (
          <div key={l} className="text-center bg-tv-green-deep/10 rounded-xl px-2.5 py-2 min-w-[44px]">
            <div className="font-display font-black text-xl leading-none tabular-nums text-tv-green-deep">{String(v).padStart(2, "0")}</div>
            <div className="text-[9px] uppercase text-tv-green-deep/45 mt-0.5">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProposalCard = ({ proposal, onVote, onUnvote, onReproponi, disabled, onVoteRequest }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const openVote = () => onVoteRequest ? onVoteRequest(() => setShowVoteModal(true)) : setShowVoteModal(true);
  const initials = [proposal.nome?.[0], proposal.cognome?.[0]].filter(Boolean).join("").toUpperCase();

  return (
    <>
      <div className={`flex flex-col rounded-[2rem] overflow-hidden transition-shadow border-2 ${proposal.is_winner ? "border-amber-400 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]" : disabled ? "border-tv-green-deep/5 opacity-50 grayscale" : "border-tv-green-deep/8 hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.12)] cursor-pointer group"} bg-white`}
           onClick={() => !disabled && setShowDetail(true)}>
        {/* Corona vincitore */}
        {proposal.is_winner && (
          <div className="bg-amber-400 text-amber-900 text-[11px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
            🏆 Vincitore del mese
          </div>
        )}
        {/* Cover */}
        <div className="relative bg-tv-green-deep/5">
          {proposal.cover_url ? (
            <img src={proposal.cover_url} alt={proposal.title}
                 className="w-full h-52 object-cover group-hover:scale-[1.02] transition-transform duration-300" />
          ) : (
            <div className="w-full h-52 flex items-center justify-center">
              <BookOpen size={40} className="text-tv-green-deep/15" />
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
              {proposal.author}{proposal.genre && <span className="italic"> · {proposal.genre}</span>}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            {initials ? (
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                <div className="w-5 h-5 rounded-full bg-tv-bordeaux/80 text-tv-cream flex items-center justify-center text-[9px] font-black shrink-0">{initials}</div>
                <span className="text-xs text-tv-green-deep/35 truncate">{[proposal.nome, proposal.cognome].filter(Boolean).join(" ")}</span>
              </div>
            ) : <span />}
            {onReproponi && (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onReproponi(proposal); }}
                className="shrink-0 text-[10px] font-bold text-tv-green-deep/35 hover:text-tv-bordeaux transition-colors px-2 py-1 rounded-full hover:bg-tv-bordeaux/8"
                style={disabled ? { pointerEvents: "auto", opacity: 1, filter: "none" } : {}}
              >
                ↩ Riproponi
              </button>
            )}
          </div>
        </div>
      </div>

      {showDetail && !showVoteModal && (
        <ProposalDetailModal
          proposal={proposal}
          onVoteRequest={() => { setShowDetail(false); openVote(); }}
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

// ── Sezione proposte ─────────────────────────────────────────────────────────
const ProposalsSection = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 7);
  });
  const [showForm, setShowForm] = useState(false);
  const [reproponiData, setReproponiData] = useState(null);
  const [clubConfig, setClubConfig] = useState(null);
  const [communityPwd, setCommunityPwd] = useState(() => localStorage.getItem(CLUB_PWD_KEY) || "");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/proposals?month=${selectedMonth}`)
      .then((r) => r.json())
      .then((d) => setProposals(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const [allMonths, setAllMonths] = useState([]);
  const loadAllMonths = useCallback(() => {
    fetch(`${BACKEND_URL}/api/proposals`)
      .then((r) => r.json())
      .then((d) => {
        const months = [...new Set((Array.isArray(d) ? d : []).map((p) => p.proposed_month))].sort().reverse();
        setAllMonths(months);
        // se il mese selezionato non ha proposte, usa il più recente che ne ha
        if (months.length > 0) setSelectedMonth(prev => months.includes(prev) ? prev : months[0]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { loadAllMonths(); }, [loadAllMonths]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedMonth) return;
    setClubConfig(null);
    fetch(`${BACKEND_URL}/api/book-club-config/${selectedMonth}`)
      .then(r => r.json())
      .then(d => setClubConfig(d))
      .catch(() => {});
  }, [selectedMonth]);

  const handleVote = async (id, voterInfo, force = false) => {
    const url = `${BACKEND_URL}/api/proposals/${id}/vote${force ? "?force=true" : ""}`;
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
    const res = await fetch(`${BACKEND_URL}/api/proposals/${id}/unvote`, {
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

  const sectionTitle = (() => {
    const ym = selectedMonth;
    if (!ym) return "Cosa leggiamo dopo?";
    try {
      const mese = new Date(ym + "-01").toLocaleDateString("it-IT", { month: "long" });
      const prep = /^[aeiouAEIOU]/.test(mese) ? "ad" : "a";
      return `Cosa leggiamo ${prep} ${mese}`;
    } catch { return "Cosa leggiamo dopo?"; }
  })();

  return (
    <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep/[0.03]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <SectionHeading
            dot="bg-tv-orange"
            label="Proposte del mese"
            title={sectionTitle}
            sub="Proponi un libro e vota i tuoi preferiti. I più votati diventano le prossime letture."
          />
          <button
            onClick={() => {
              const needsPwd = clubConfig?.community_password;
              if (needsPwd && !communityPwd) { setPendingAction("form"); setShowPwdModal(true); }
              else setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors shrink-0"
          >
            <Plus size={15} /> Proponi un libro
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

        {/* Countdown fine votazioni */}
        {clubConfig?.voting_ends_at && !clubConfig?.winner_proclaimed && (
          <VotingCountdown
            endsAt={clubConfig.voting_ends_at}
            onExpire={() => {
              fetch(`${BACKEND_URL}/api/book-club-config/${selectedMonth}/proclaim-winner`, { method: "POST" })
                .then(() => {
                  load();
                  fetch(`${BACKEND_URL}/api/book-club-config/${selectedMonth}`)
                    .then(r => r.json()).then(d => setClubConfig(d)).catch(() => {});
                })
                .catch(() => {});
            }}
          />
        )}

        {/* Banner vincitore */}
        {clubConfig?.winner_proclaimed && (
          <div className="flex items-center gap-3 mb-6 bg-amber-50 border-2 border-amber-400 rounded-2xl px-5 py-3">
            <span className="text-xl">🏆</span>
            <div>
              <div className="font-black text-sm text-amber-800">Votazioni chiuse — Vincitore proclamato!</div>
            </div>
          </div>
        )}

        {/* Banner Rush Finale */}
        {clubConfig?.rush_finale_active && !clubConfig?.winner_proclaimed && (
          <div className="flex items-center gap-3 mb-6 bg-tv-bordeaux/8 border border-tv-bordeaux/20 rounded-2xl px-5 py-3">
            <span className="text-lg">🏁</span>
            <div>
              <div className="font-black text-sm text-tv-bordeaux">Rush Finale in corso</div>
              <div className="text-xs text-tv-green-deep/50">I voti sono stati azzerati. Rivota solo tra i libri finalisti!</div>
            </div>
          </div>
        )}

        {/* Griglia proposte */}
        {loading ? (
          <div className="text-tv-green-deep/30 text-sm py-8 text-center">Caricamento…</div>
        ) : proposals.length === 0 ? (
          <div className="rounded-[2rem] bg-white border border-tv-green-deep/8 p-10 text-center text-tv-green-deep/40">
            <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nessuna proposta per {fmtMonthYear(selectedMonth)}.</p>
            <p className="text-sm mt-1">Sii il primo a proporre un libro!</p>
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors">
              <Plus size={14} /> Proponi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...proposals].sort((a, b) => (a.rush_excluded ? 1 : 0) - (b.rush_excluded ? 1 : 0)).map((p) => (
              <ProposalCard key={p.id} proposal={p} onVote={handleVote} onUnvote={handleUnvote}
                disabled={!!p.rush_excluded}
                onReproponi={(prop) => { setReproponiData(prop); setShowForm(true); }}
                onVoteRequest={(proceed) => {
                  if (clubConfig?.community_password && !communityPwd) {
                    setPendingAction(() => proceed);
                    setShowPwdModal(true);
                  } else { proceed(); }
                }} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProposalForm currentMonth={selectedMonth} onSubmit={() => { loadAllMonths(); load(); }}
          onClose={() => { setShowForm(false); setReproponiData(null); }}
          initialData={reproponiData} />
      )}
      {showPwdModal && (
        <PasswordModal club="club-del-libro" onClose={() => { setShowPwdModal(false); setPendingAction(null); }}
          onSuccess={(pwd) => {
            setCommunityPwd(pwd); setShowPwdModal(false);
            if (pendingAction === "form") setShowForm(true);
            else if (typeof pendingAction === "function") pendingAction();
            setPendingAction(null);
          }} />
      )}
    </section>
  );
};

// ── Pagina principale ────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

const CommunityLibrary = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [communityPwd, setCommunityPwd] = useState(() => localStorage.getItem(CLUB_PWD_KEY) || "");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // modali
  const [showAddForm, setShowAddForm] = useState(false);
  const [takeTarget, setTakeTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);

  // form aggiungi
  const [addForm, setAddForm] = useState({ title: "", author: "", added_by: "" });
  const [addSaving, setAddSaving] = useState(false);

  // form prendi
  const [takeForm, setTakeForm] = useState({ lent_to_name: "", lent_to_surname: "", lent_date: today() });
  const [takeSaving, setTakeSaving] = useState(false);

  // form restituisci
  const [returnForm, setReturnForm] = useState({ returned_date: today() });
  const [returnSaving, setReturnSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/community-library`)
      .then(r => r.json()).then(d => setBooks(Array.isArray(d) ? d : [])).catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const withPwd = (action) => {
    if (!communityPwd) { setPendingAction(() => action); setShowPwdModal(true); }
    else action();
  };

  const doAdd = async () => {
    if (!addForm.title.trim()) return;
    setAddSaving(true);
    try {
      await fetch(`${BACKEND_URL}/api/community-library`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, club: "club-del-libro", password: communityPwd }),
      });
      setAddForm({ title: "", author: "", added_by: "" });
      setShowAddForm(false); load();
    } catch { alert("Errore. Riprova."); }
    finally { setAddSaving(false); }
  };

  const doTake = async () => {
    if (!takeForm.lent_to_name.trim() || !takeForm.lent_to_surname.trim()) return;
    setTakeSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/community-library/${takeTarget.id}/take`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...takeForm, password: communityPwd }),
      });
      if (res.status === 403) { setCommunityPwd(""); localStorage.removeItem(CLUB_PWD_KEY); alert("Password non valida."); return; }
      setTakeTarget(null); load();
    } catch { alert("Errore. Riprova."); }
    finally { setTakeSaving(false); }
  };

  const doReturn = async () => {
    setReturnSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/community-library/${returnTarget.id}/return`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...returnForm, password: communityPwd }),
      });
      if (res.status === 403) { setCommunityPwd(""); localStorage.removeItem(CLUB_PWD_KEY); alert("Password non valida."); return; }
      setReturnTarget(null); load();
    } catch { alert("Errore. Riprova."); }
    finally { setReturnSaving(false); }
  };

  const fieldClass = "w-full px-3 py-2.5 rounded-xl bg-tv-green-deep/20 border border-tv-cream/10 focus:border-tv-cream/30 outline-none text-tv-cream text-sm placeholder:text-tv-cream/30";
  const labelClass = "block text-[10px] font-bold uppercase tracking-wider text-tv-cream/40 mb-1";
  const available = books.filter(b => b.status === "available");
  const lent = books.filter(b => b.status === "lent");

  return (
    <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep text-tv-cream">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Library size={18} className="text-tv-orange" />
              <span className="text-xs font-black uppercase tracking-widest text-tv-cream/50">Biblioteca condivisa</span>
            </div>
            <h2 className="font-display font-black text-3xl md:text-4xl text-tv-cream leading-tight">Scambio libri community</h2>
            <p className="mt-2 text-tv-cream/55 max-w-xl">Libri messi a disposizione da chi partecipa al Club. Prendili di persona agli incontri e segnali qui quando li prendi o restituisci.</p>
          </div>
          <button onClick={() => withPwd(() => { setAddForm({ title: "", author: "", added_by: "" }); setShowAddForm(true); })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors shrink-0">
            <Plus size={15} /> Aggiungi un libro
          </button>
        </div>

        {loading ? (
          <div className="text-tv-cream/30 text-sm">Caricamento…</div>
        ) : books.length === 0 ? (
          <div className="rounded-[2rem] bg-tv-cream/10 border border-tv-cream/10 p-10 text-center text-tv-cream/40">
            <Library size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Nessun libro ancora disponibile.</p>
            <p className="text-sm mt-1 opacity-70">Sii il primo ad aggiungere un libro!</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {available.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-tv-green/70 mb-4">✅ Disponibili ({available.length})</div>
                <div className="grid md:grid-cols-2 gap-3">
                  {available.map(b => (
                    <div key={b.id} className="flex gap-3 items-start rounded-2xl bg-tv-cream/8 border border-tv-cream/8 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-tv-cream leading-tight">{b.title}</div>
                        {b.author && <div className="text-sm text-tv-cream/55">{b.author}</div>}
                        {b.added_by && <div className="text-xs text-tv-cream/35 mt-1">Aggiunto da {b.added_by}</div>}
                      </div>
                      <button onClick={() => withPwd(() => { setTakeForm({ lent_to_name: "", lent_to_surname: "", lent_date: today() }); setTakeTarget(b); })}
                        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-tv-orange/20 text-tv-orange hover:bg-tv-orange/30 transition-colors">
                        Prendo io
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {lent.length > 0 && (
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-tv-orange/70 mb-4">📤 In giro ({lent.length})</div>
                <div className="grid md:grid-cols-2 gap-3">
                  {lent.map(b => (
                    <div key={b.id} className="flex gap-3 items-start rounded-2xl bg-tv-orange/8 border border-tv-orange/15 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-tv-cream leading-tight">{b.title}</div>
                        {b.author && <div className="text-sm text-tv-cream/55">{b.author}</div>}
                        <div className="text-xs text-tv-orange/70 mt-1 font-bold">
                          {b.lent_to_name} {b.lent_to_surname}
                          {b.lent_date && <span className="font-normal text-tv-cream/35"> · dal {b.lent_date}</span>}
                        </div>
                      </div>
                      <button onClick={() => withPwd(() => { setReturnForm({ returned_date: today() }); setReturnTarget(b); })}
                        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-tv-cream/10 text-tv-cream/60 hover:bg-tv-cream/20 transition-colors flex items-center gap-1">
                        <RotateCcw size={11} /> Restituito
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal aggiungi libro */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/70 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-tv-green-deep border border-tv-cream/15 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg text-tv-cream">Aggiungi un libro</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-full hover:bg-tv-cream/10"><X size={16} className="text-tv-cream/60" /></button>
            </div>
            <div className="grid gap-3">
              <label><div className={labelClass}>Titolo *</div><input className={fieldClass} value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} placeholder="es. Il nome della rosa" /></label>
              <label><div className={labelClass}>Autore</div><input className={fieldClass} value={addForm.author} onChange={e => setAddForm(f => ({ ...f, author: e.target.value }))} placeholder="es. Umberto Eco" /></label>
              <label><div className={labelClass}>Chi lo porta</div><input className={fieldClass} value={addForm.added_by} onChange={e => setAddForm(f => ({ ...f, added_by: e.target.value }))} placeholder="es. Maria R." /></label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2.5 rounded-full border border-tv-cream/20 text-tv-cream font-bold text-sm">Annulla</button>
                <button onClick={doAdd} disabled={addSaving || !addForm.title.trim()} className="flex-1 px-4 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm disabled:opacity-60">
                  {addSaving ? "…" : "Aggiungi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal prendi libro */}
      {takeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/70 p-4" onClick={() => setTakeTarget(null)}>
          <div className="bg-tv-green-deep border border-tv-cream/15 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-black text-lg text-tv-cream">Prendo «{takeTarget.title}»</h3>
              <button onClick={() => setTakeTarget(null)} className="p-1.5 rounded-full hover:bg-tv-cream/10"><X size={16} className="text-tv-cream/60" /></button>
            </div>
            <p className="text-xs text-tv-cream/40 mb-4">Inserisci il tuo nome per segnare che hai preso il libro.</p>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <label><div className={labelClass}>Nome *</div><input className={fieldClass} value={takeForm.lent_to_name} onChange={e => setTakeForm(f => ({ ...f, lent_to_name: e.target.value }))} placeholder="Maria" /></label>
                <label><div className={labelClass}>Cognome *</div><input className={fieldClass} value={takeForm.lent_to_surname} onChange={e => setTakeForm(f => ({ ...f, lent_to_surname: e.target.value }))} placeholder="Rossi" /></label>
              </div>
              <label><div className={labelClass}>Data di presa</div><input type="date" className={fieldClass} value={takeForm.lent_date} onChange={e => setTakeForm(f => ({ ...f, lent_date: e.target.value }))} /></label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setTakeTarget(null)} className="flex-1 px-4 py-2.5 rounded-full border border-tv-cream/20 text-tv-cream font-bold text-sm">Annulla</button>
                <button onClick={doTake} disabled={takeSaving || !takeForm.lent_to_name.trim() || !takeForm.lent_to_surname.trim()} className="flex-1 px-4 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm disabled:opacity-60">
                  {takeSaving ? "…" : "Confermo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal restituisci */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/70 p-4" onClick={() => setReturnTarget(null)}>
          <div className="bg-tv-green-deep border border-tv-cream/15 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-black text-lg text-tv-cream">Restituisco «{returnTarget.title}»</h3>
              <button onClick={() => setReturnTarget(null)} className="p-1.5 rounded-full hover:bg-tv-cream/10"><X size={16} className="text-tv-cream/60" /></button>
            </div>
            <p className="text-xs text-tv-cream/40 mb-4">Questo libro tornerà disponibile per tutti.</p>
            <div className="grid gap-3">
              <label><div className={labelClass}>Data di restituzione</div><input type="date" className={fieldClass} value={returnForm.returned_date} onChange={e => setReturnForm(f => ({ ...f, returned_date: e.target.value }))} /></label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setReturnTarget(null)} className="flex-1 px-4 py-2.5 rounded-full border border-tv-cream/20 text-tv-cream font-bold text-sm">Annulla</button>
                <button onClick={doReturn} disabled={returnSaving} className="flex-1 px-4 py-2.5 rounded-full bg-tv-cream text-tv-green-deep font-bold text-sm disabled:opacity-60">
                  {returnSaving ? "…" : "Restituito ✓"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPwdModal && (
        <PasswordModal club="club-del-libro" onClose={() => { setShowPwdModal(false); setPendingAction(null); }}
          onSuccess={(pwd) => {
            setCommunityPwd(pwd); setShowPwdModal(false);
            if (typeof pendingAction === "function") pendingAction();
            setPendingAction(null);
          }} />
      )}
    </section>
  );
};

export const ClubDelLibro = () => {
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/books`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/events`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/reviews`).then((r) => r.json()),
    ])
      .then(([bk, ev, rv]) => {
        setBooks(Array.isArray(bk) ? bk : []);
        setEvents(Array.isArray(ev) ? ev : []);
        setReviews(Array.isArray(rv) ? rv : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reviewsByBook = useMemo(() => {
    const map = {};
    reviews.forEach((r) => { if (!map[r.book_id]) map[r.book_id] = []; map[r.book_id].push(r); });
    return map;
  }, [reviews]);

  const inLettura   = books.filter((b) => b.status === "in_lettura" && !b.is_lent && !b.is_library_book);
  const conclusi    = books.filter((b) => b.status === "concluso" && !b.is_library_book);
  const prossimi    = books.filter((b) => b.status === "prossimamente" && !b.is_library_book);
  const disponibili = books.filter((b) => b.in_biblioteca && !b.is_lent && !b.is_to_find);
  const inPrestito  = books.filter((b) => b.is_lent);
  const daReperire  = books.filter((b) => b.is_to_find);

  const cardProps = { reviewsByBook, events };

  return (
    <div className="bg-tv-cream">
      {/* Hero */}
      <section className="pt-32 pb-6 md:pt-40 md:pb-8 px-6 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tv-green-deep/90 text-tv-cream text-xs font-bold uppercase tracking-wider mb-7">
            <BookOpen size={13} /> Club del Libro · Trama Viva APS
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.93] tracking-tight text-tv-green-deep">
            Leggiamo <span className="italic font-light text-tv-bordeaux">insieme</span>,<br />cresciamo insieme.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-tv-green-deep/65">
            Ogni mese scegliamo un libro, lo discutiamo e condividiamo impressioni, voti e recensioni. Puoi proporre titoli, votare quelli degli altri e prendere libri in prestito dalla nostra community.
          </p>
        </div>
      </section>

      {/* WhatsApp community strip */}
      <div className="px-6 md:px-10 pb-6 md:pb-8">
        <div className="mx-auto max-w-5xl">
          <a
            href={WHATSAPP_COMMUNITY}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/15 transition-colors group"
          >
            <MessageCircle size={18} className="text-[#25D366] shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-widest text-tv-green-deep/50 mb-0.5">Community WhatsApp</div>
              <div className="text-sm font-bold text-tv-green-deep leading-tight">Unisciti al gruppo del Club del Libro</div>
            </div>
            <ArrowRight size={14} className="text-tv-green-deep/30 group-hover:translate-x-0.5 transition-transform shrink-0 ml-auto" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-tv-green-deep/40 py-24">Caricamento…</div>
      ) : (
        <>
          {/* Stiamo leggendo — on top */}
          {inLettura.length > 0 && (
            <section className="pt-4 pb-14 md:pt-6 md:pb-20 px-6 md:px-10">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-green" label="Ora in corso" title="Stiamo leggendo" labelSize="text-sm" />
                <div className="grid md:grid-cols-2 gap-5">
                  {inLettura.map((b) => <BookCard key={b.id} book={b} {...cardProps} />)}
                </div>
              </div>
            </section>
          )}

          {/* Proposte del mese — sezione con votazione */}
          <ProposalsSection />

          {/* Archivio */}
          {conclusi.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-sky" label="Archivio" title="Libri letti" sub="La nostra storia di letture condivise." />
                <div className="grid md:grid-cols-2 gap-5">
                  {conclusi.map((b) => <BookCard key={b.id} book={b} {...cardProps} />)}
                </div>
              </div>
            </section>
          )}

          {/* Prossimamente */}
          {prossimi.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep/[0.03]">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-orange" label="In arrivo" title="Prossime letture selezionate" />
                <div className="grid md:grid-cols-2 gap-5">
                  {prossimi.map((b) => <BookCard key={b.id} book={b} {...cardProps} />)}
                </div>
              </div>
            </section>
          )}

          {/* Biblioteca condivisa community */}
          <CommunityLibrary />
        </>
      )}
    </div>
  );
};

// ── Card club per la sezione "I nostri club" in home ─────────────────────────
export const ClubDelLibroTeaser = () => {
  const [current, setCurrent] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/books`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/reviews`).then((r) => r.json()),
    ])
      .then(([bk, rv]) => {
        const books = Array.isArray(bk) ? bk : [];
        setCurrent(books.find((b) => b.status === "in_lettura" && !b.is_lent && !b.is_library_book) || null);
        setReviews(Array.isArray(rv) ? rv : []);
      })
      .catch(() => {});
  }, []);

  const bookReviews = current ? reviews.filter((r) => r.book_id === current.id) : [];
  const avgRating = bookReviews.length
    ? (bookReviews.reduce((s, r) => s + (r.rating ?? 5), 0) / bookReviews.length).toFixed(1)
    : null;

  return (
    <Link
      to="/club-del-libro"
      className="group flex flex-col rounded-[2rem] bg-white border border-tv-green-deep/10 overflow-hidden hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.12)] hover:border-tv-green-deep/20 transition-all"
    >
      <div className="h-1.5 bg-gradient-to-r from-tv-green to-tv-green-deep" />

      <div className="p-6 flex-1 flex flex-col gap-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-2">
            <BookOpen size={11} /> Club del Libro
          </div>
          <p className="text-sm text-tv-green-deep/55 leading-relaxed">
            Ci ritroviamo ogni mese attorno a un libro. Si legge, si discute, si lascia qualcosa — una recensione, un voto, un consiglio.
          </p>
        </div>

        {current ? (
          <div className="flex gap-3 items-start rounded-2xl bg-tv-green-deep/[0.04] p-3">
            {current.cover_url ? (
              <img src={current.cover_url} alt={current.title} className="w-10 h-14 object-cover rounded-xl shrink-0 shadow-sm" />
            ) : (
              <div className="w-10 h-14 rounded-xl bg-tv-green-deep/10 flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-tv-green-deep/30" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/35 mb-0.5">Stiamo leggendo</div>
              <div className="font-bold text-tv-green-deep text-sm leading-tight truncate">{current.title}</div>
              <div className="text-xs text-tv-green-deep/50 mt-0.5 truncate">{current.author}</div>
              {avgRating && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-tv-green-deep/45">
                  <span className="text-tv-orange text-[11px]">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
                  <span className="font-bold">{avgRating}</span>
                  <span>· {bookReviews.length} rec.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-tv-green-deep/[0.04] p-3 text-xs text-tv-green-deep/35 italic">
            Nessuna lettura attiva al momento — le proposte del mese ti aspettano.
          </div>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between">
          <span className="text-xs text-tv-green-deep/35">Proposte · Recensioni · Biblioteca</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-tv-green-deep group-hover:text-tv-green transition-colors">
            Entra nel club <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ClubDelLibro;
