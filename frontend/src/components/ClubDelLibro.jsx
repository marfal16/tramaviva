import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, ArrowRight, Send, Library } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_DOT = {
  in_lettura:    "bg-tv-green",
  concluso:      "bg-tv-sky",
  prossimamente: "bg-tv-orange",
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

// ── Sezione heading riutilizzabile ──────────────────────────────────────────
const SectionHeading = ({ dot, label, title, sub }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/50">{label}</span>
    </div>
    <h2 className="font-display font-black text-3xl md:text-4xl text-tv-green-deep leading-tight">{title}</h2>
    {sub && <p className="mt-2 text-tv-green-deep/60 text-base">{sub}</p>}
  </div>
);

// ── Card libro ───────────────────────────────────────────────────────────────
const BookCard = ({ book, events = [] }) => {
  const evMap = Object.fromEntries(events.map(e => [e.id, e]));
  const linked = (book.linked_event_ids || []).map(id => evMap[id]).filter(Boolean);

  return (
    <article className="bg-white rounded-[2rem] border border-tv-green-deep/8 flex flex-col overflow-hidden hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.12)] transition-shadow">
      <div className="flex gap-5 p-6 flex-1">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-20 h-28 object-cover rounded-2xl shrink-0 shadow-md"
          />
        ) : (
          <div className="w-20 h-28 rounded-2xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
            <BookOpen size={26} className="text-tv-green-deep/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-black text-lg leading-tight text-tv-green-deep">{book.title}</h3>
          <div className="text-sm text-tv-green-deep/55 mt-0.5">
            {book.author}
            {book.genre && <span className="italic"> · {book.genre}</span>}
          </div>
          {book.reading_month && (
            <div className="mt-1.5 text-xs text-tv-green-deep/40 flex items-center gap-1">
              <Calendar size={10} /> {fmtMonthYear(book.reading_month)}
            </div>
          )}
          {book.description && (
            <p className="mt-2.5 text-sm text-tv-green-deep/65 leading-relaxed line-clamp-3">{book.description}</p>
          )}
        </div>
      </div>

      {book.recensione && (
        <div className="mx-5 mb-5 rounded-2xl bg-tv-mint/40 border-l-4 border-tv-green p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-1">La nostra lettura</div>
          <p className="text-sm text-tv-green-deep/80 leading-relaxed">{book.recensione}</p>
        </div>
      )}

      {linked.length > 0 && (
        <div className="px-5 pb-5 flex flex-col gap-1.5">
          <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/35 mb-1">Evento collegato</div>
          {linked.map(ev => (
            <Link
              key={ev.id}
              to={`/eventi/${ev.slug || ev.id}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-tv-green-deep hover:text-tv-bordeaux transition-colors"
            >
              <Calendar size={11} /> {ev.title} <ArrowRight size={10} />
            </Link>
          ))}
        </div>
      )}
    </article>
  );
};

// ── Form recensione ──────────────────────────────────────────────────────────
const ReviewForm = ({ books, onSubmit }) => {
  const readableBooks = books.filter(b => b.status === "concluso" || b.status === "in_lettura");
  const [bookId, setBookId] = useState("");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!bookId || !name.trim() || !content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_name: name.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setName(""); setContent(""); setBookId("");
      onSubmit();
    } catch {
      alert("Errore nell'invio. Riprova.");
    } finally { setSending(false); }
  };

  if (sent) return (
    <div className="rounded-[2rem] bg-tv-green/15 border border-tv-green/30 p-8 text-center">
      <div className="text-3xl mb-3">📚</div>
      <div className="font-display font-black text-xl text-tv-green-deep">Grazie per la tua recensione!</div>
      <p className="mt-2 text-tv-green-deep/60 text-sm">La tua voce arricchisce il nostro club.</p>
      <button onClick={() => setSent(false)} className="mt-4 px-5 py-2.5 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm">
        Scrivi un'altra
      </button>
    </div>
  );

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-white border border-tv-green-deep/8 p-6 md:p-8 grid gap-4">
      <div className="font-display font-black text-xl text-tv-green-deep">Scrivi la tua recensione</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Libro</label>
          <select className={fieldClass} value={bookId} onChange={e => setBookId(e.target.value)} required>
            <option value="">Scegli un libro…</option>
            {readableBooks.map(b => (
              <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Il tuo nome</label>
          <input className={fieldClass} value={name} onChange={e => setName(e.target.value)} placeholder="es. Maria" required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">La tua recensione</label>
        <textarea
          className={`${fieldClass} resize-none`}
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Cosa ti ha colpito? Cosa consiglieresti ad altri lettori?"
          required
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="self-end inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green transition-colors disabled:opacity-60"
      >
        <Send size={14} /> {sending ? "Invio…" : "Pubblica recensione"}
      </button>
    </form>
  );
};

// ── Card recensione ──────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
  const initials = review.reviewer_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <article className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-tv-bordeaux text-tv-cream flex items-center justify-center font-black text-sm shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-bold text-tv-green-deep text-sm">{review.reviewer_name}</div>
          <div className="text-xs text-tv-green-deep/40">{fmtDay(review.created_at)}</div>
        </div>
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-tv-bordeaux/70">su «{review.book_title}»</div>
      <p className="text-sm text-tv-green-deep/75 leading-relaxed">{review.content}</p>
    </article>
  );
};

// ── Pagina principale ────────────────────────────────────────────────────────
export const ClubDelLibro = () => {
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    fetch(`${BACKEND_URL}/api/books`).then(r => r.json()),
    fetch(`${BACKEND_URL}/api/events`).then(r => r.json()),
    fetch(`${BACKEND_URL}/api/reviews`).then(r => r.json()),
  ])
    .then(([bk, ev, rv]) => {
      setBooks(Array.isArray(bk) ? bk : []);
      setEvents(Array.isArray(ev) ? ev : []);
      setReviews(Array.isArray(rv) ? rv : []);
    })
    .catch(() => {})
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const libriDelMese = useMemo(
    () => books.filter(b => b.reading_month === currentMonth || b.status === "in_lettura"),
    [books, currentMonth]
  );
  const biblioteca = useMemo(() => books.filter(b => b.in_biblioteca), [books]);
  const disponibili = biblioteca.filter(b => !b.is_lent);
  const inPrestito  = biblioteca.filter(b => b.is_lent);

  return (
    <div className="bg-tv-cream">
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 px-6 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tv-green-deep/90 text-tv-cream text-xs font-bold uppercase tracking-wider mb-7">
            <BookOpen size={13} /> Club del Libro · Trama Viva APS
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.93] tracking-tight text-tv-green-deep">
            Leggiamo{" "}
            <span className="italic font-light text-tv-bordeaux">insieme</span>,<br />
            cresciamo insieme.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-tv-green-deep/65">
            Ogni mese scegliamo un libro, lo discutiamo e lasciamo traccia di quello che ci ha mosso. Puoi partecipare, leggere, recensire e prendere in prestito libri dalla nostra piccola biblioteca in sede.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="text-center text-tv-green-deep/40 py-24">Caricamento…</div>
      ) : (
        <>
          {/* ── Libri del mese ─────────────────────────────────────────── */}
          {libriDelMese.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-cream">
              <div className="mx-auto max-w-5xl">
                <SectionHeading
                  dot="bg-tv-green"
                  label="Questo mese"
                  title="Libri del mese"
                  sub="Questi sono i libri che stiamo leggendo o che abbiamo scelto per il mese corrente."
                />
                <div className="grid md:grid-cols-2 gap-5">
                  {libriDelMese.map(b => <BookCard key={b.id} book={b} events={events} />)}
                </div>
              </div>
            </section>
          )}

          {/* ── Tutti i libri passati ──────────────────────────────────── */}
          {books.filter(b => b.status === "concluso").length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep/[0.03]">
              <div className="mx-auto max-w-5xl">
                <SectionHeading
                  dot="bg-tv-sky"
                  label="Archivio"
                  title="Libri letti"
                  sub="La nostra storia di letture condivise."
                />
                <div className="grid md:grid-cols-2 gap-5">
                  {books.filter(b => b.status === "concluso").map(b => <BookCard key={b.id} book={b} events={events} />)}
                </div>
              </div>
            </section>
          )}

          {/* ── Prossimamente ─────────────────────────────────────────── */}
          {books.filter(b => b.status === "prossimamente").length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-cream">
              <div className="mx-auto max-w-5xl">
                <SectionHeading
                  dot="bg-tv-orange"
                  label="In arrivo"
                  title="Prossime letture"
                />
                <div className="grid md:grid-cols-2 gap-5">
                  {books.filter(b => b.status === "prossimamente").map(b => <BookCard key={b.id} book={b} events={events} />)}
                </div>
              </div>
            </section>
          )}

          {/* ── Biblioteca / Libro sospeso ────────────────────────────── */}
          {biblioteca.length > 0 && (
            <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-green-deep text-tv-cream">
              <div className="mx-auto max-w-5xl">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Library size={18} className="text-tv-orange" />
                    <span className="text-xs font-black uppercase tracking-widest text-tv-cream/50">Biblioteca</span>
                  </div>
                  <h2 className="font-display font-black text-3xl md:text-4xl text-tv-cream leading-tight">
                    Libri in sede &amp; prestiti
                  </h2>
                  <p className="mt-2 text-tv-cream/55 text-base">
                    Questi libri sono disponibili nella nostra sede fisica. Puoi prenderli in prestito — chiedici!
                  </p>
                </div>

                {disponibili.length > 0 && (
                  <div className="mb-10">
                    <div className="text-xs font-black uppercase tracking-widest text-tv-cream/40 mb-4">
                      ✅ Disponibili in sede ({disponibili.length})
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {disponibili.map(b => (
                        <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-cream/10 border border-tv-cream/10 p-4">
                          {b.cover_url ? (
                            <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0" />
                          ) : (
                            <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0">
                              <BookOpen size={18} className="text-tv-cream/30" />
                            </div>
                          )}
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
                    <div className="text-xs font-black uppercase tracking-widest text-tv-orange/80 mb-4">
                      📤 Libro sospeso — in prestito ({inPrestito.length})
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {inPrestito.map(b => (
                        <div key={b.id} className="flex gap-4 items-center rounded-2xl bg-tv-bordeaux/20 border border-tv-bordeaux/30 p-4">
                          {b.cover_url ? (
                            <img src={b.cover_url} alt={b.title} className="w-12 h-16 object-cover rounded-xl shrink-0 opacity-70" />
                          ) : (
                            <div className="w-12 h-16 rounded-xl bg-tv-cream/10 flex items-center justify-center shrink-0">
                              <BookOpen size={18} className="text-tv-cream/30" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-tv-cream leading-tight truncate">{b.title}</div>
                            <div className="text-sm text-tv-cream/55">{b.author}</div>
                            {b.lent_date && (
                              <div className="text-xs text-tv-orange/70 mt-1 flex items-center gap-1">
                                <Calendar size={10} /> In prestito dal {fmtDay(b.lent_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Recensioni ────────────────────────────────────────────── */}
          <section className="py-14 md:py-20 px-6 md:px-10 bg-tv-cream">
            <div className="mx-auto max-w-5xl">
              <SectionHeading
                dot="bg-tv-bordeaux"
                label="Voci del club"
                title="Recensioni"
                sub="Ogni lettore lascia una traccia. Ispira chi verrà dopo di te."
              />

              <div className="grid md:grid-cols-2 gap-10 items-start">
                <div>
                  {reviews.length === 0 ? (
                    <div className="rounded-[2rem] bg-tv-green-deep/5 border border-tv-green-deep/8 p-10 text-center text-tv-green-deep/40">
                      <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
                      Nessuna recensione ancora — sii il primo!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                    </div>
                  )}
                </div>

                {books.some(b => b.status === "concluso" || b.status === "in_lettura") && (
                  <ReviewForm books={books} onSubmit={load} />
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

// ── Teaser minimale per la home ──────────────────────────────────────────────
export const ClubDelLibroTeaser = () => {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/books`)
      .then(r => r.json())
      .then(data => {
        const books = Array.isArray(data) ? data : [];
        setCurrent(books.find(b => b.status === "in_lettura") || null);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-2">
      <Link
        to="/club-del-libro"
        className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-tv-green-deep/5 border border-tv-green-deep/10 hover:bg-tv-green-deep/10 transition-colors"
      >
        <BookOpen size={18} className="text-tv-green-deep/50 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold text-tv-green-deep text-sm">Club del Libro</span>
          {current ? (
            <span className="ml-2 text-sm text-tv-green-deep/50">
              — stiamo leggendo <em>«{current.title}»</em> di {current.author}
            </span>
          ) : (
            <span className="ml-2 text-sm text-tv-green-deep/40">— libri, recensioni e biblioteca</span>
          )}
        </div>
        <ArrowRight size={15} className="text-tv-green-deep/30 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};

export default ClubDelLibro;
