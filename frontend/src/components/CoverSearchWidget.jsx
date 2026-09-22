import React, { useState } from "react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CoverSearchWidget = ({ defaultType = "book", onSelect }) => {
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState(defaultType);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setSearching(true); setResults([]); setSearched(false);
    try {
      const res = await fetch(`${API}/cover-search?q=${encodeURIComponent(q.trim())}&type=${type}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch { toast.error("Errore nella ricerca copertine."); }
    finally { setSearching(false); setSearched(true); }
  };

  const toggle = () => {
    setShow(s => !s);
    setResults([]);
    setSearched(false);
    setQ("");
  };

  return (
    <div className="mt-1">
      <button type="button" onClick={toggle}
        className="text-xs font-bold text-tv-green-deep/50 hover:text-tv-green-deep underline underline-offset-2 transition-colors">
        🔍 Cerca copertina
      </button>
      {show && (
        <div className="mt-2 p-3 rounded-xl bg-tv-cream/60 border border-tv-green-deep/10 space-y-2">
          <div className="flex gap-1.5">
            {[{ v: "book", l: "📚 Libro" }, { v: "movie", l: "🎬 Film" }].map(t => (
              <button key={t.v} type="button" onClick={() => { setType(t.v); setResults([]); setSearched(false); }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${type === t.v ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "bg-white text-tv-green-deep/60 border-tv-green-deep/20"}`}>
                {t.l}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input type="text" value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), search())}
              placeholder={type === "book" ? "Titolo libro…" : "Titolo film…"}
              className="flex-1 px-3 py-1.5 rounded-lg border border-tv-green-deep/15 bg-white text-sm text-tv-green-deep outline-none focus:border-tv-green" />
            <button type="button" onClick={search} disabled={searching}
              className="px-3 py-1.5 rounded-lg bg-tv-green-deep text-tv-cream text-xs font-bold disabled:opacity-60">
              {searching ? "…" : "Cerca"}
            </button>
          </div>
          {results.length > 0 && (
            <div className="grid grid-cols-5 gap-1.5 max-h-52 overflow-y-auto pt-1">
              {results.map((r, i) => (
                <button key={i} type="button"
                  onClick={() => { onSelect(r.image); setShow(false); setResults([]); setQ(""); setSearched(false); }}
                  className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-tv-green-deep transition-all"
                  title={`${r.title}${r.year ? ` (${r.year})` : ""}`}>
                  <img src={r.thumb} alt={r.title} className="w-full aspect-[2/3] object-cover" />
                  <div className="absolute inset-0 bg-tv-green-deep/0 group-hover:bg-tv-green-deep/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
          {searched && !searching && results.length === 0 && (
            <p className="text-[11px] text-tv-green-deep/40 text-center">Nessun risultato — prova con un altro titolo.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverSearchWidget;
