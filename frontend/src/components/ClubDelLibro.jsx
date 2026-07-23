import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, ArrowRight, Library, Star, Plus, ThumbsUp, X, MessageCircle } from "lucide-react";
import { AvgStars } from "./LibroDettaglio";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VOTED_KEY = "tv_voted_proposals";
const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/IXeTAXUIfdK54NiJEaO7Pt";

const getVoted = () => {
  try { return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveVoted = (set) => {
  try { localStorage.setItem(VOTED_KEY, JSON.stringify([...set])); } catch {}
};

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
const ProposalForm = ({ currentMonth, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    title: "", author: "", genre: "", cover_url: "", description: "",
    proposed_month: currentMonth, nome: "", cognome: "", in_community_whatsapp: null,
  });
  const [sending, setSending] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
          in_community_whatsapp: form.in_community_whatsapp,
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
          <h2 className="font-display font-black text-xl text-tv-green-deep">Proponi un libro</h2>
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
            <div className={labelClass}>Sei nella community WhatsApp del Club del Libro? *</div>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer transition-colors text-sm font-bold ${form.in_community_whatsapp === true ? "bg-tv-green/15 border-tv-green text-tv-green-deep" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
                <input type="radio" name="whatsapp" className="hidden" onChange={() => set("in_community_whatsapp", true)} />
                ✅ Sì
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border cursor-pointer transition-colors text-sm font-bold ${form.in_community_whatsapp === false ? "bg-tv-bordeaux/10 border-tv-bordeaux/30 text-tv-bordeaux" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
                <input type="radio" name="whatsapp" className="hidden" onChange={() => set("in_community_whatsapp", false)} />
                ❌ No
              </label>
            </div>
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
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Genere</div>
              <input className={fieldClass} value={form.genre} onChange={(e) => set("genre", e.target.value)} placeholder="es. Giallo, Romanzo…" />
            </label>
            <label>
              <div className={labelClass}>Mese proposta</div>
              <input className={fieldClass} value={form.proposed_month} onChange={(e) => set("proposed_month", e.target.value)} placeholder="AAAA-MM" />
            </label>
          </div>
          <label>
            <div className={labelClass}>URL copertina (opzionale)</div>
            <input className={fieldClass} value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." />
          </label>
          <label>
            <div className={labelClass}>Breve descrizione / trama</div>
            <textarea className={`${fieldClass} resize-none`} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
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
const VoteModal = ({ proposal, onVote, onClose }) => {
  const [form, setForm] = useState({ nome: "", cognome: "", in_community_whatsapp: null });
  const [sending, setSending] = useState(false);
  const [duplicateOf, setDuplicateOf] = useState(null); // nome+cognome del duplicato trovato
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const doVote = async () => {
    setSending(true);
    try {
      await onVote(proposal.id, { nome: form.nome.trim(), cognome: form.cognome.trim(), in_community_whatsapp: form.in_community_whatsapp });
      onClose();
    } catch {}
    finally { setSending(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.cognome.trim()) return;
    const nome = form.nome.trim().toLowerCase();
    const cognome = form.cognome.trim().toLowerCase();
    const existing = (proposal.voters || []).find(
      (v) => v.nome?.trim().toLowerCase() === nome && v.cognome?.trim().toLowerCase() === cognome
    );
    if (existing) {
      setDuplicateOf(`${existing.nome} ${existing.cognome}`);
      return;
    }
    await doVote();
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
              <p className="text-xs text-tv-green-deep/55">Se sei un omonimo puoi comunque procedere.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDuplicateOf(null)} className="flex-1 px-3 py-2 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-xs">
                  Annulla
                </button>
                <button type="button" onClick={doVote} disabled={sending} className="flex-1 px-3 py-2 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-xs disabled:opacity-60">
                  {sending ? "…" : "Sono un omonimo, vota"}
                </button>
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
                  <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer text-xs font-bold transition-colors ${form.in_community_whatsapp === true ? "bg-tv-green/15 border-tv-green text-tv-green-deep" : "bg-white border-tv-green-deep/15 text-tv-green-deep/50"}`}>
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

// ── Modal rimozione voto ─────────────────────────────────────────────────────
const UnvoteModal = ({ proposal, onUnvote, onClose }) => {
  const [form, setForm] = useState({ nome: "", cognome: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.cognome.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onUnvote(proposal.id, { nome: form.nome.trim(), cognome: form.cognome.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || "Nessun voto trovato per questo nome. Controlla di aver scritto nome e cognome esattamente come quando hai votato.");
    } finally { setSending(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-tv-green-deep/60 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-tv-green-deep/10">
          <span className="font-bold text-tv-green-deep text-base">Rimuovi voto da «{proposal.title}»</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-tv-green-deep/10"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 grid gap-3">
          <p className="text-xs text-tv-green-deep/50">Inserisci nome e cognome usati al momento del voto per rimuoverlo.</p>
          {error && (
            <div className="rounded-2xl bg-tv-bordeaux/10 border border-tv-bordeaux/25 p-3 text-xs font-medium text-tv-bordeaux">
              {error}
            </div>
          )}
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
            <button type="submit" disabled={sending} className="flex-1 px-4 py-2.5 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm disabled:opacity-60">
              {sending ? "…" : "Rimuovi voto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal dettaglio proposta ─────────────────────────────────────────────────
const ProposalDetailModal = ({ proposal, voted, onVoteRequest, onUnvoteRequest, onClose }) => {
  const hasVoted = voted.has(proposal.id);
  const initials = [proposal.nome?.[0], proposal.cognome?.[0]].filter(Boolean).join("").toUpperCase();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
            {proposal.proposed_month && (
              <div className="mt-2 text-xs text-tv-green-deep/40 flex items-center gap-1">
                <Calendar size={10} /> Proposto per {fmtMonthYear(proposal.proposed_month)}
              </div>
            )}
            {initials && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-tv-bordeaux text-tv-cream flex items-center justify-center text-[10px] font-black shrink-0">{initials}</div>
                <span className="text-xs text-tv-green-deep/50">{[proposal.nome, proposal.cognome].filter(Boolean).join(" ")}</span>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => hasVoted ? onUnvoteRequest() : onVoteRequest()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  hasVoted
                    ? "bg-tv-green/15 border border-tv-green/30 text-tv-green-deep hover:bg-tv-bordeaux/10 hover:border-tv-bordeaux/30 hover:text-tv-bordeaux"
                    : "bg-tv-orange text-tv-green-deep hover:bg-tv-orange/80"
                }`}
              >
                <ThumbsUp size={14} /> {hasVoted ? `Votato · ${proposal.votes}` : `Vota · ${proposal.votes}`}
              </button>
              {hasVoted && (
                <span className="text-[10px] text-tv-green-deep/35">Clicca per rimuovere il tuo voto</span>
              )}
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
const ProposalCard = ({ proposal, voted, onVote, onUnvote }) => {
  const hasVoted = voted.has(proposal.id);
  const [showDetail, setShowDetail] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showUnvoteModal, setShowUnvoteModal] = useState(false);
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
              <BookOpen size={40} className="text-tv-green-deep/15" />
            </div>
          )}
          {/* Vote badge */}
          <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-sm ${
            hasVoted ? "bg-tv-green text-tv-cream" : "bg-white/90 text-tv-green-deep/70"
          }`}>
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
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-tv-bordeaux/80 text-tv-cream flex items-center justify-center text-[9px] font-black shrink-0">{initials}</div>
                <span className="text-xs text-tv-green-deep/35 truncate">{[proposal.nome, proposal.cognome].filter(Boolean).join(" ")}</span>
              </div>
            ) : <span />}
            <span className="text-xs text-tv-green-deep/30 shrink-0">{fmtMonthYear(proposal.proposed_month)}</span>
          </div>
        </div>
      </div>

      {showDetail && !showVoteModal && !showUnvoteModal && (
        <ProposalDetailModal
          proposal={proposal}
          voted={voted}
          onVoteRequest={() => { setShowDetail(false); setShowVoteModal(true); }}
          onUnvoteRequest={() => { setShowDetail(false); setShowUnvoteModal(true); }}
          onClose={() => setShowDetail(false)}
        />
      )}
      {showVoteModal && (
        <VoteModal
          proposal={proposal}
          onVote={onVote}
          onClose={() => setShowVoteModal(false)}
        />
      )}
      {showUnvoteModal && (
        <UnvoteModal
          proposal={proposal}
          onUnvote={onUnvote}
          onClose={() => setShowUnvoteModal(false)}
        />
      )}
    </>
  );
};

// ── Sezione proposte ─────────────────────────────────────────────────────────
const ProposalsSection = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [voted, setVoted] = useState(getVoted);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/proposals?month=${selectedMonth}`)
      .then((r) => r.json())
      .then((d) => setProposals(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const [allMonths, setAllMonths] = useState([]);
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/proposals`)
      .then((r) => r.json())
      .then((d) => {
        const months = [...new Set((Array.isArray(d) ? d : []).map((p) => p.proposed_month))].sort().reverse();
        const current = new Date().toISOString().slice(0, 7);
        if (!months.includes(current)) months.unshift(current);
        setAllMonths(months);
      })
      .catch(() => setAllMonths([new Date().toISOString().slice(0, 7)]));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (id, voterInfo) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/proposals/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(voterInfo || {}),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => b.votes - a.votes));
      const newVoted = new Set(voted);
      newVoted.add(id);
      setVoted(newVoted);
      saveVoted(newVoted);
    } catch {}
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
    const newVoted = new Set(voted);
    newVoted.delete(id);
    setVoted(newVoted);
    saveVoted(newVoted);
  };

  const nextMonthLabel = getNextMonthTitle();
  const nextMonthPrep = nextMonthLabel && /^[aeiouAEIOU]/.test(nextMonthLabel) ? "ad" : "a";
  const sectionTitle = nextMonthLabel ? `Cosa leggiamo ${nextMonthPrep} ${nextMonthLabel}` : "Cosa leggiamo dopo?";

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
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors shrink-0"
          >
            <Plus size={15} /> Proponi un libro
          </button>
        </div>

        {/* Filtro mese */}
        {allMonths.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar">
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
            <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nessuna proposta per {fmtMonthYear(selectedMonth)}.</p>
            <p className="text-sm mt-1">Sii il primo a proporre un libro!</p>
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors">
              <Plus size={14} /> Proponi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} voted={voted} onVote={handleVote} onUnvote={handleUnvote} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ProposalForm currentMonth={selectedMonth} onSubmit={load} onClose={() => setShowForm(false)} />
      )}
    </section>
  );
};

// ── Pagina principale ────────────────────────────────────────────────────────
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

  const inLettura   = books.filter((b) => b.status === "in_lettura" && !b.is_lent);
  const conclusi    = books.filter((b) => b.status === "concluso");
  const prossimi    = books.filter((b) => b.status === "prossimamente");
  const biblioteca  = books.filter((b) => b.in_biblioteca);
  const disponibili = biblioteca.filter((b) => !b.is_lent && !b.is_to_find);
  const inPrestito  = biblioteca.filter((b) => b.is_lent);
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
            Ogni mese scegliamo un libro, lo discutiamo e condividiamo impressioni, voti e recensioni. Puoi proporre titoli, votare quelli degli altri e prendere libri in prestito dalla nostra comunità.
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

          {/* Biblioteca — sempre visibile */}
          <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep text-tv-cream">
            <div className="mx-auto max-w-5xl">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Library size={18} className="text-tv-orange" />
                  <span className="text-xs font-black uppercase tracking-widest text-tv-cream/50">Biblioteca condivisa</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-tv-cream leading-tight">Libri in sospeso</h2>
                <p className="mt-2 text-tv-cream/55">Libri messi a disposizione dalla nostra comunità. Puoi prenderli in prestito e restituirli al prossimo incontro — contattaci per sapere come.</p>
              </div>

              {biblioteca.length === 0 && daReperire.length === 0 ? (
                <div className="rounded-[2rem] bg-tv-cream/10 border border-tv-cream/10 p-10 text-center text-tv-cream/40">
                  <Library size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">Nessun libro disponibile al momento.</p>
                  <p className="text-sm mt-1 opacity-70">Torna presto — la nostra biblioteca condivisa è in continua crescita.</p>
                </div>
              ) : (
                <div className="grid gap-8">
                  {disponibili.length > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-tv-cream/40 mb-4">✅ Disponibili ({disponibili.length})</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {disponibili.map((b) => (
                          <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-cream/10 border border-tv-cream/10 p-4">
                            {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0" /> : <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-tv-cream/30" /></div>}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-tv-cream leading-tight truncate">{b.title}</div>
                              <div className="text-sm text-tv-cream/55">{b.author}</div>
                              {b.genre && <div className="text-xs text-tv-cream/35 italic mt-0.5">{b.genre}</div>}
                              {(b.quantity || 1) > 1 && <div className="text-xs text-tv-green/70 mt-1 font-bold">{b.quantity} cop. disponibili</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {inPrestito.length > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-tv-orange/80 mb-4">📤 In prestito ({inPrestito.length})</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {inPrestito.map((b) => (
                          <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-bordeaux/20 border border-tv-bordeaux/30 p-4">
                            {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0 opacity-70" /> : <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-tv-cream/30" /></div>}
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-tv-cream leading-tight truncate">{b.title}</div>
                              <div className="text-sm text-tv-cream/55">{b.author}</div>
                              {b.lent_to && (
                                <div className="text-xs text-tv-orange/80 mt-1 flex items-center gap-1.5 font-bold">
                                  <span className="w-5 h-5 rounded-full bg-tv-orange/30 flex items-center justify-center text-[9px]">{b.lent_to.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</span>
                                  {b.lent_to}
                                </div>
                              )}
                              {b.lent_date && <div className="text-xs text-tv-orange/60 mt-0.5 flex items-center gap-1"><Calendar size={10} /> dal {fmtDay(b.lent_date)}</div>}
                              {(b.quantity || 1) > 1 && <div className="text-xs text-tv-cream/50 mt-1">{b.quantity} copie totali</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {daReperire.length > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-tv-sky/80 mb-4">🔍 Da reperire in autonomia ({daReperire.length})</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {daReperire.map((b) => (
                          <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-sky/10 border border-tv-sky/20 p-4">
                            {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0 opacity-70" /> : <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-tv-cream/30" /></div>}
                            <div className="min-w-0">
                              <div className="font-bold text-tv-cream leading-tight truncate">{b.title}</div>
                              <div className="text-sm text-tv-cream/55">{b.author}</div>
                              {b.genre && <div className="text-xs text-tv-cream/35 italic mt-0.5">{b.genre}</div>}
                              <div className="text-xs text-tv-sky/70 mt-1">Acquistalo o cercalo in biblioteca</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
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
        setCurrent(books.find((b) => b.status === "in_lettura") || null);
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
