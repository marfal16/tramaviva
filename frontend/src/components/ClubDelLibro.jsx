import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const STATUS_INFO = {
  in_lettura:    { label: "In lettura",    bg: "bg-tv-green/20",   text: "text-tv-green-deep", dot: "bg-tv-green" },
  concluso:      { label: "Concluso",      bg: "bg-tv-sky/30",     text: "text-tv-green-deep", dot: "bg-tv-sky" },
  prossimamente: { label: "Prossimamente", bg: "bg-tv-orange/20",  text: "text-tv-green-deep", dot: "bg-tv-orange" },
};

const fmtMonth = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  } catch { return iso; }
};

const BookCard = ({ book }) => {
  const st = STATUS_INFO[book.status] || STATUS_INFO.prossimamente;
  return (
    <article className="bg-white rounded-[2rem] border border-tv-green-deep/10 overflow-hidden flex flex-col">
      <div className="flex gap-5 p-6">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-20 h-28 md:w-24 md:h-32 object-cover rounded-2xl shrink-0 shadow-md"
          />
        ) : (
          <div className="w-20 h-28 md:w-24 md:h-32 rounded-2xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
            <BookOpen size={28} className="text-tv-green-deep/25" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${st.bg} ${st.text} mb-3`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          <h3 className="font-display font-black text-lg leading-tight text-tv-green-deep">{book.title}</h3>
          <div className="text-sm text-tv-green-deep/60 mt-0.5">
            {book.author}{book.genre ? <> · <span className="italic">{book.genre}</span></> : null}
          </div>
          {(book.start_date || book.end_date) && (
            <div className="mt-2 text-xs text-tv-green-deep/45 flex items-center gap-1">
              <Calendar size={11} />
              {book.start_date && fmtMonth(book.start_date)}
              {book.start_date && book.end_date && " → "}
              {book.end_date && fmtMonth(book.end_date)}
            </div>
          )}
        </div>
      </div>

      {book.description && (
        <div className="px-6 pb-4 text-sm text-tv-green-deep/70 leading-relaxed border-t border-tv-green-deep/5 pt-4">
          {book.description}
        </div>
      )}

      {book.recensione && book.status === "concluso" && (
        <div className="mx-6 mb-5 rounded-2xl bg-tv-mint/40 p-4 border-l-4 border-tv-green text-sm text-tv-green-deep leading-relaxed">
          <div className="text-[10px] font-black uppercase tracking-wider text-tv-green-deep/50 mb-1">La nostra recensione</div>
          {book.recensione}
        </div>
      )}

      {book.linked_events && book.linked_events.length > 0 && (
        <div className="px-6 pb-5">
          <div className="text-[10px] font-black uppercase tracking-wider text-tv-green-deep/40 mb-2">Collegato all'evento</div>
          <div className="flex flex-col gap-1.5">
            {book.linked_events.map(ev => (
              <Link
                key={ev.id}
                to={`/eventi/${ev.slug || ev.id}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-tv-green-deep hover:text-tv-bordeaux transition-colors"
              >
                <Calendar size={11} /> {ev.title} <ArrowRight size={10} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export const ClubDelLibro = () => {
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/books`).then(r => r.json()),
      fetch(`${BACKEND_URL}/api/events`).then(r => r.json()),
    ])
      .then(([bk, ev]) => {
        const evMap = Object.fromEntries((Array.isArray(ev) ? ev : []).map(e => [e.id, e]));
        const enriched = (Array.isArray(bk) ? bk : []).map(b => ({
          ...b,
          linked_events: (b.linked_event_ids || []).map(id => evMap[id]).filter(Boolean),
        }));
        setBooks(enriched);
        setEvents(ev);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inLettura    = books.filter(b => b.status === "in_lettura");
  const prossimi     = books.filter(b => b.status === "prossimamente");
  const conclusi     = books.filter(b => b.status === "concluso");

  return (
    <section id="club-del-libro" className="py-20 md:py-28 bg-tv-cream min-h-screen">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tv-green-deep/90 text-tv-cream text-xs font-bold uppercase tracking-wider mb-6">
            <BookOpen size={14} /> Club del Libro
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-tv-green-deep">
            Leggiamo{" "}
            <span className="italic font-light text-tv-bordeaux">insieme</span>.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-tv-green-deep/70">
            Un libro, una comunità. Ogni mese scegliamo una lettura condivisa, discutiamo, scopriamo e cresciamo insieme attraverso le storie.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-tv-green-deep/50 py-20">Caricamento…</div>
        ) : books.length === 0 ? (
          <div className="text-center text-tv-green-deep/50 py-20">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Nessun libro ancora — torna presto!</p>
          </div>
        ) : (
          <div className="space-y-14">
            {inLettura.length > 0 && (
              <div>
                <h2 className="font-display font-black text-2xl text-tv-green-deep mb-6 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tv-green inline-block" /> Stiamo leggendo
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {inLettura.map(b => <BookCard key={b.id} book={b} />)}
                </div>
              </div>
            )}

            {prossimi.length > 0 && (
              <div>
                <h2 className="font-display font-black text-2xl text-tv-green-deep mb-6 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tv-orange inline-block" /> Prossimamente
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {prossimi.map(b => <BookCard key={b.id} book={b} />)}
                </div>
              </div>
            )}

            {conclusi.length > 0 && (
              <div>
                <h2 className="font-display font-black text-2xl text-tv-green-deep mb-6 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tv-sky inline-block" /> Abbiamo letto
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {conclusi.map(b => <BookCard key={b.id} book={b} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export const ClubDelLibroTeaser = () => {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/books`)
      .then(r => r.json())
      .then(data => {
        const books = Array.isArray(data) ? data : [];
        const inLettura = books.find(b => b.status === "in_lettura");
        setCurrent(inLettura || null);
      })
      .catch(() => {});
  }, []);

  if (!current) return null;

  return (
    <section className="py-16 md:py-20 bg-tv-cream">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="rounded-[2.5rem] bg-tv-green-deep overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            {current.cover_url ? (
              <img
                src={current.cover_url}
                alt={current.title}
                className="w-28 h-40 md:w-36 md:h-52 object-cover rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] shrink-0"
              />
            ) : (
              <div className="w-28 h-40 md:w-36 md:h-52 rounded-2xl bg-tv-cream/10 flex items-center justify-center shrink-0">
                <BookOpen size={40} className="text-tv-cream/30" />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tv-green/30 text-tv-cream text-[10px] font-black uppercase tracking-wider mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-tv-green animate-pulse" />
                Stiamo leggendo
              </div>
              <h2 className="font-display font-black text-3xl md:text-4xl text-tv-cream leading-tight">
                {current.title}
              </h2>
              <div className="mt-1 text-tv-cream/60 font-medium">
                {current.author}{current.genre ? ` · ${current.genre}` : ""}
              </div>
              {current.description && (
                <p className="mt-4 text-tv-cream/75 text-sm md:text-base leading-relaxed max-w-lg">
                  {current.description}
                </p>
              )}
              <div className="mt-6">
                <a
                  href="/club-del-libro"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-cream text-tv-green-deep font-bold text-sm hover:bg-tv-mint transition-colors"
                >
                  <BookOpen size={15} /> Scopri il Club del Libro
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClubDelLibro;
