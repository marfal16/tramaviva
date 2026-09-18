import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
};

export const CancellaPrenotazione = () => {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/cancel-signup/${token}`);
        if (!res.ok) { setNotFound(true); return; }
        setInfo(await res.json());
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleCancel = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${API}/api/cancel-signup/${token}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      alert("Errore durante la cancellazione. Riprova o contattaci a tramavivaaps@gmail.com");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-tv-green-deep/20 border-t-tv-green-deep rounded-full animate-spin" />
          </div>
        ) : notFound ? (
          <div className="bg-white rounded-[2rem] border border-tv-green-deep/10 p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h1 className="font-display font-black text-2xl text-tv-green-deep mb-2">Link non valido</h1>
            <p className="text-sm text-tv-green-deep/55 leading-relaxed mb-6">
              Il link di cancellazione non è valido o la prenotazione è già stata cancellata.
            </p>
            <Link to="/eventi" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green-deep/90 transition-colors">
              Vai agli eventi
            </Link>
          </div>
        ) : done ? (
          <div className="bg-white rounded-[2rem] border border-tv-green-deep/10 p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="font-display font-black text-2xl text-tv-green-deep mb-2">Prenotazione cancellata</h1>
            <p className="text-sm text-tv-green-deep/55 leading-relaxed mb-6">
              La tua prenotazione per <strong>{info?.event_title}</strong> è stata cancellata con successo. Speriamo di vederti al prossimo evento!
            </p>
            <Link to="/#eventi" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green-deep/90 transition-colors">
              Scopri i prossimi eventi
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-tv-green-deep/10 p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎟️</div>
              <h1 className="font-display font-black text-2xl text-tv-green-deep">Disdici prenotazione</h1>
              <p className="mt-2 text-sm text-tv-green-deep/55">Stai per cancellare la tua prenotazione</p>
            </div>
            <div className="bg-tv-cream/60 rounded-2xl p-5 mb-6 space-y-2 text-sm text-tv-green-deep">
              <div><span className="font-bold">Evento:</span> {info?.event_title}</div>
              {info?.event_date && (
                <div><span className="font-bold">Data:</span> {fmtDate(info.event_date)}{info?.event_time ? ` alle ${info.event_time}` : ""}</div>
              )}
              {info?.event_location && (
                <div><span className="font-bold">Luogo:</span> {info.event_location}</div>
              )}
              <div><span className="font-bold">Intestatario:</span> {info?.name}</div>
              {info?.is_waitlist && (
                <div className="mt-2 px-3 py-1.5 bg-tv-orange/10 rounded-xl text-tv-orange text-xs font-bold">
                  ⏳ Sei in lista di attesa
                </div>
              )}
            </div>
            <p className="text-sm text-tv-green-deep/55 leading-relaxed mb-6">
              Sei sicuro di voler cancellare? L'operazione non è reversibile.
              {info?.confirmed && !info?.is_waitlist && " Se cancelli, il posto tornerà disponibile per altri."}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCancel}
                disabled={confirming}
                className="w-full py-3 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm flex items-center justify-center gap-2 hover:bg-tv-bordeaux/90 transition-colors disabled:opacity-50"
              >
                {confirming
                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-tv-cream/40 border-t-tv-cream rounded-full" /> Cancellazione...</>
                  : "Sì, cancella la mia prenotazione"}
              </button>
              <Link to="/#eventi"
                className="w-full py-3 rounded-full border border-tv-green-deep/20 text-tv-green-deep/60 font-bold text-sm text-center hover:border-tv-green-deep/40 hover:text-tv-green-deep transition-all">
                Torna agli eventi
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CancellaPrenotazione;
