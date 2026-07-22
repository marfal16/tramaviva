import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, ArrowRight, Library, Star, Plus, ThumbsUp, X, Send } from "lucide-react";
import { AvgStars } from "./LibroDettaglio";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const VOTED_KEY = "tv_voted_proposals";

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

const SectionHeading = ({ dot, label, title, sub }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/50">{label}</span>
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
          <h3 className="font-display font-black text-lg leading-tight text-tv-green-deep">{book.title}</h3>
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
  const [form, setForm] = useState({ title: "", author: "", genre: "", cover_url: "", description: "", proposed_month: currentMonth });
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
              <div className={labelClass}>Titolo *</div>
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

// ── Riga proposta nella lista ────────────────────────────────────────────────
const ProposalRow = ({ proposal, voted, onVote }) => {
  const hasVoted = voted.has(proposal.id);
  return (
    <div className="flex items-center gap-4 py-4 border-b border-tv-green-deep/6 last:border-0">
      {proposal.cover_url ? (
        <img src={proposal.cover_url} alt={proposal.title} className="w-10 h-14 object-cover rounded-xl shrink-0" />
      ) : (
        <div className="w-10 h-14 rounded-xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-tv-green-deep/20" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-tv-green-deep leading-tight truncate">{proposal.title}</div>
        <div className="text-sm text-tv-green-deep/55">
          {proposal.author}{proposal.genre && <span className="italic"> · {proposal.genre}</span>}
        </div>
        {proposal.description && (
          <p className="text-xs text-tv-green-deep/50 mt-0.5 line-clamp-2 leading-relaxed">{proposal.description}</p>
        )}
      </div>
      <button
        onClick={() => !hasVoted && onVote(proposal.id)}
        disabled={hasVoted}
        className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl border transition-colors min-w-[52px] ${
          hasVoted
            ? "bg-tv-green/15 border-tv-green/30 text-tv-green-deep cursor-default"
            : "border-tv-green-deep/15 text-tv-green-deep/50 hover:bg-tv-green-deep/5 hover:border-tv-green-deep/30 cursor-pointer"
        }`}
      >
        <ThumbsUp size={14} />
        <span className="font-black text-sm">{proposal.votes}</span>
      </button>
    </div>
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

  // Fetch all proposals to derive available months
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

  const handleVote = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/proposals/${id}/vote`, { method: "POST" });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)).sort((a, b) => b.votes - a.votes));
      const newVoted = new Set(voted);
      newVoted.add(id);
      setVoted(newVoted);
      saveVoted(newVoted);
    } catch {}
  };

  return (
    <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep/[0.03]">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <SectionHeading
            dot="bg-tv-orange"
            label="Proposte del mese"
            title="Cosa leggiamo dopo?"
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
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

        {/* Lista proposte */}
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
          <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 px-6">
            {proposals.map((p) => (
              <ProposalRow key={p.id} proposal={p} voted={voted} onVote={handleVote} />
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

  const inLettura   = books.filter((b) => b.status === "in_lettura");
  const conclusi    = books.filter((b) => b.status === "concluso");
  const prossimi    = books.filter((b) => b.status === "prossimamente");
  const biblioteca  = books.filter((b) => b.in_biblioteca);
  const disponibili = biblioteca.filter((b) => !b.is_lent);
  const inPrestito  = biblioteca.filter((b) => b.is_lent);

  const cardProps = { reviewsByBook, events };

  return (
    <div className="bg-tv-cream">
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 px-6 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tv-green-deep/90 text-tv-cream text-xs font-bold uppercase tracking-wider mb-7">
            <BookOpen size={13} /> Club del Libro · Trama Viva APS
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.93] tracking-tight text-tv-green-deep">
            Leggiamo <span className="italic font-light text-tv-bordeaux">insieme</span>,<br />cresciamo insieme.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-tv-green-deep/65">
            Ogni mese scegliamo un libro, lo discutiamo e lasciamo traccia di quello che ci ha mosso. Puoi leggere, recensire, votare le proposte e prendere in prestito libri dalla nostra biblioteca in sede.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="text-center text-tv-green-deep/40 py-24">Caricamento…</div>
      ) : (
        <>
          {/* Stiamo leggendo — on top */}
          {inLettura.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10">
              <div className="mx-auto max-w-5xl">
                <SectionHeading dot="bg-tv-green" label="Ora" title="Stiamo leggendo" />
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
                  <span className="text-xs font-black uppercase tracking-widest text-tv-cream/50">Biblioteca</span>
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-tv-cream leading-tight">Libri in sede &amp; prestiti</h2>
                <p className="mt-2 text-tv-cream/55">Questi libri sono disponibili nella nostra sede fisica. Puoi prenderli in prestito — chiedici!</p>
              </div>

              {biblioteca.length === 0 ? (
                <div className="rounded-[2rem] bg-tv-cream/10 border border-tv-cream/10 p-10 text-center text-tv-cream/40">
                  <Library size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">Nessun libro in sede ancora.</p>
                  <p className="text-sm mt-1 opacity-70">I libri marcati come "disponibili in sede" dall'admin appariranno qui.</p>
                </div>
              ) : (
                <>
                  {disponibili.length > 0 && (
                    <div className="mb-10">
                      <div className="text-xs font-black uppercase tracking-widest text-tv-cream/40 mb-4">✅ Disponibili in sede ({disponibili.length})</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {disponibili.map((b) => (
                          <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-cream/10 border border-tv-cream/10 p-4">
                            {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0" /> : <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-tv-cream/30" /></div>}
                            <div className="min-w-0">
                              <div className="font-bold text-tv-cream leading-tight truncate">{b.title}</div>
                              <div className="text-sm text-tv-cream/55">{b.author}</div>
                              {b.genre && <div className="text-xs text-tv-cream/35 italic mt-0.5">{b.genre}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {inPrestito.length > 0 && (
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-tv-orange/80 mb-4">📤 Libro sospeso — in prestito ({inPrestito.length})</div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {inPrestito.map((b) => (
                          <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-bordeaux/20 border border-tv-bordeaux/30 p-4">
                            {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0 opacity-70" /> : <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-tv-cream/30" /></div>}
                            <div className="min-w-0">
                              <div className="font-bold text-tv-cream leading-tight truncate">{b.title}</div>
                              <div className="text-sm text-tv-cream/55">{b.author}</div>
                              {b.lent_date && <div className="text-xs text-tv-orange/70 mt-1 flex items-center gap-1"><Calendar size={10} /> In prestito dal {fmtDay(b.lent_date)}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

// ── Teaser home ──────────────────────────────────────────────────────────────
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
    ? (bookReviews.reduce((s, r) => s + (r.rating || 5), 0) / bookReviews.length).toFixed(1)
    : null;

  return (
    <section className="py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Link
          to="/club-del-libro"
          className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-[2rem] bg-tv-green-deep/[0.04] border border-tv-green-deep/10 px-6 py-5 hover:bg-tv-green-deep/8 transition-colors"
        >
          {current?.cover_url ? (
            <img src={current.cover_url} alt={current.title} className="w-14 h-20 object-cover rounded-xl shrink-0 shadow-md" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-tv-green-deep/10 flex items-center justify-center shrink-0">
              <BookOpen size={22} className="text-tv-green-deep/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-1">Club del Libro · Trama Viva</div>
            {current ? (
              <>
                <div className="font-display font-black text-lg text-tv-green-deep leading-tight">
                  Stiamo leggendo: <span className="italic">{current.title}</span>
                </div>
                <div className="text-sm text-tv-green-deep/55 mt-0.5">{current.author}{current.genre ? ` · ${current.genre}` : ""}</div>
                {avgRating && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-tv-green-deep/50">
                    <span className="text-tv-orange">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</span>
                    <span className="font-bold">{avgRating}</span>
                    <span>· {bookReviews.length} recension{bookReviews.length === 1 ? "e" : "i"}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-display font-black text-lg text-tv-green-deep">Club del Libro</div>
                <div className="text-sm text-tv-green-deep/50">Proposte, recensioni e biblioteca in sede</div>
              </>
            )}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm shrink-0 group-hover:bg-tv-green transition-colors">
            Scopri il club <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </section>
  );
};

export default ClubDelLibro;
