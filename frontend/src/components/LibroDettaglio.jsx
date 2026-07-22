import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Calendar, ArrowLeft, Send, Star } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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

// ── Stelle interattive ───────────────────────────────────────────────────────
const StarInput = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-3xl leading-none transition-colors focus:outline-none"
          style={{ color: (hovered || value) >= star ? "#E07B2A" : "#d1cfc3" }}
          aria-label={`${star} stelle`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// ── Stelle di visualizzazione ────────────────────────────────────────────────
const StarDisplay = ({ rating, size = "sm" }) => {
  const filled = Math.round(rating || 0);
  const sz = size === "sm" ? "text-base" : "text-xl";
  return (
    <span className={`flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: filled >= s ? "#E07B2A" : "#d1cfc3" }}>★</span>
      ))}
    </span>
  );
};

// ── Media stelle ─────────────────────────────────────────────────────────────
export const AvgStars = ({ reviews }) => {
  if (!reviews || reviews.length === 0) return null;
  const avg = reviews.reduce((sum, r) => sum + (r.rating ?? 5), 0) / reviews.length;
  return (
    <div className="flex items-center gap-1.5">
      <StarDisplay rating={avg} size="sm" />
      <span className="text-xs font-bold text-tv-green-deep/50">
        {avg.toFixed(1)} <span className="font-normal">({reviews.length} recension{reviews.length === 1 ? "e" : "i"})</span>
      </span>
    </div>
  );
};

// ── Card recensione ──────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => {
  const initials = review.reviewer_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <article className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-tv-bordeaux text-tv-cream flex items-center justify-center font-black text-sm shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-bold text-tv-green-deep">{review.reviewer_name}</div>
          <div className="text-xs text-tv-green-deep/40">{fmtDay(review.created_at)}</div>
        </div>
        <div className="ml-auto">
          <StarDisplay rating={review.rating} size="sm" />
        </div>
      </div>
      <p className="text-tv-green-deep/75 leading-relaxed">{review.content}</p>
    </article>
  );
};

// ── Form recensione con stelle ───────────────────────────────────────────────
const ReviewForm = ({ bookId, bookTitle, onSubmit }) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_name: name.trim(), content: content.trim(), rating }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setName(""); setContent(""); setRating(5);
      onSubmit();
    } catch {
      alert("Errore nell'invio. Riprova.");
    } finally { setSending(false); }
  };

  if (sent) return (
    <div className="rounded-[2rem] bg-tv-green/15 border border-tv-green/30 p-8 text-center">
      <div className="text-4xl mb-3">📚</div>
      <div className="font-display font-black text-xl text-tv-green-deep">Grazie per la tua recensione!</div>
      <p className="mt-2 text-tv-green-deep/60">La tua voce arricchisce il nostro club.</p>
      <button onClick={() => setSent(false)} className="mt-4 px-5 py-2.5 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm">
        Scrivi un'altra
      </button>
    </div>
  );

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1.5";

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-tv-green-deep/[0.04] border border-tv-green-deep/8 p-6 md:p-8">
      <h3 className="font-display font-black text-xl text-tv-green-deep mb-5">Scrivi la tua recensione</h3>
      <div className="grid gap-5">
        <div>
          <div className={labelClass}>La tua valutazione</div>
          <StarInput value={rating} onChange={setRating} />
        </div>
        <div>
          <label className={labelClass}>Il tuo nome</label>
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Maria" required />
        </div>
        <div>
          <label className={labelClass}>La tua recensione</label>
          <textarea
            className={`${fieldClass} resize-none`}
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Cosa ti ha colpito di «${bookTitle}»? Lo consiglieresti?`}
            required
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green transition-colors disabled:opacity-60 w-fit"
        >
          <Send size={14} /> {sending ? "Invio…" : "Pubblica recensione"}
        </button>
      </div>
    </form>
  );
};

// ── Pagina dettaglio libro ───────────────────────────────────────────────────
export const LibroDettaglio = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = () =>
    fetch(`${BACKEND_URL}/api/reviews`)
      .then((r) => r.json())
      .then((data) => setReviews((Array.isArray(data) ? data : []).filter((r) => r.book_id === bookId)))
      .catch(() => {});

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/books/${bookId}`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/events`).then((r) => r.json()),
      loadReviews(),
    ])
      .then(([bk, ev]) => {
        setBook(bk && !bk.detail ? bk : null);
        setEvents(Array.isArray(ev) ? ev : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId]);

  const evMap = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);
  const linkedEvents = useMemo(
    () => (book?.linked_event_ids || []).map((id) => evMap[id]).filter(Boolean),
    [book, evMap]
  );
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length
    : null;

  const STATUS_INFO = {
    in_lettura:    { label: "In lettura",    dot: "bg-tv-green" },
    concluso:      { label: "Concluso",      dot: "bg-tv-sky" },
    prossimamente: { label: "Prossimamente", dot: "bg-tv-orange" },
  };

  if (loading) return (
    <div className="min-h-screen bg-tv-cream flex items-center justify-center text-tv-green-deep/40">
      Caricamento…
    </div>
  );

  if (!book) return (
    <div className="min-h-screen bg-tv-cream flex flex-col items-center justify-center gap-4 text-tv-green-deep/50">
      <BookOpen size={40} className="opacity-20" />
      <p className="font-bold">Libro non trovato.</p>
      <Link to="/club-del-libro" className="text-tv-bordeaux font-bold hover:underline">← Torna al Club del Libro</Link>
    </div>
  );

  const st = STATUS_INFO[book.status] || STATUS_INFO.prossimamente;

  return (
    <div className="bg-tv-cream min-h-screen">
      <div className="mx-auto max-w-4xl px-6 md:px-10 pt-32 md:pt-40 pb-20">
        {/* Back link */}
        <Link
          to="/club-del-libro"
          className="inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep/50 hover:text-tv-green-deep mb-10 transition-colors"
        >
          <ArrowLeft size={15} /> Club del Libro
        </Link>

        {/* Book info */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-14">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-40 md:w-52 h-56 md:h-72 object-cover rounded-[2rem] shadow-[0_20px_60px_-20px_rgba(5,47,23,0.25)] shrink-0 self-start"
            />
          ) : (
            <div className="w-40 md:w-52 h-56 md:h-72 rounded-[2rem] bg-tv-green-deep/8 flex items-center justify-center shrink-0 self-start">
              <BookOpen size={48} className="text-tv-green-deep/20" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
              <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/40">{st.label}</span>
            </div>

            <h1 className="font-display font-black text-4xl md:text-5xl leading-tight text-tv-green-deep">
              {book.title}
            </h1>
            <div className="mt-2 text-xl text-tv-green-deep/55 font-medium">
              {book.author}
              {book.genre && <span className="italic text-base"> · {book.genre}</span>}
            </div>

            {avgRating !== null && (
              <div className="mt-3 flex items-center gap-2">
                <StarDisplay rating={avgRating} size="md" />
                <span className="text-sm text-tv-green-deep/50 font-bold">
                  {avgRating.toFixed(1)} · {reviews.length} recension{reviews.length === 1 ? "e" : "i"}
                </span>
              </div>
            )}

            {book.reading_month && (
              <div className="mt-3 text-sm text-tv-green-deep/40 flex items-center gap-1.5">
                <Calendar size={13} /> {fmtMonthYear(book.reading_month)}
              </div>
            )}

            {book.description && (
              <p className="mt-5 text-tv-green-deep/70 leading-relaxed text-base">{book.description}</p>
            )}

            {linkedEvents.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-black uppercase tracking-widest text-tv-green-deep/35 mb-2">Evento collegato</div>
                {linkedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/eventi/${ev.slug || ev.id}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep hover:text-tv-bordeaux transition-colors"
                  >
                    <Calendar size={13} /> {ev.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recensione della redazione */}
        {book.recensione && (
          <div className="mb-14 rounded-[2rem] bg-tv-mint/40 border-l-4 border-tv-green p-6 md:p-8">
            <div className="text-xs font-black uppercase tracking-widest text-tv-green-deep/40 mb-3">La nostra lettura</div>
            <p className="text-tv-green-deep/80 leading-relaxed text-base">{book.recensione}</p>
          </div>
        )}

        {/* Recensioni dei lettori */}
        <div className="mb-14">
          <h2 className="font-display font-black text-3xl text-tv-green-deep mb-2">
            Recensioni
          </h2>
          {avgRating !== null && (
            <div className="flex items-center gap-2 mb-6">
              <StarDisplay rating={avgRating} size="md" />
              <span className="text-tv-green-deep/50">{avgRating.toFixed(1)} su 5 · {reviews.length} lettori</span>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="rounded-[2rem] bg-white border border-tv-green-deep/8 p-10 text-center text-tv-green-deep/40">
              <Star size={36} className="mx-auto mb-3 opacity-15" />
              <p className="font-bold">Nessuna recensione ancora.</p>
              <p className="text-sm mt-1 opacity-70">Sii il primo a condividere la tua opinione!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </div>

        {/* Form nuova recensione */}
        {(book.status === "concluso" || book.status === "in_lettura") && (
          <ReviewForm bookId={bookId} bookTitle={book.title} onSubmit={loadReviews} />
        )}
      </div>
    </div>
  );
};

export default LibroDettaglio;
