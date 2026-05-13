import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ArrowLeft, Share2, Send, Copy, MessageCircle } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ThreadsBg } from "./ThreadsBg";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
};

const categoryColor = {
  "Aperitivi & Chiacchiere": { bg: "bg-tv-orange", text: "text-tv-green-deep" },
  "Passeggiate": { bg: "bg-tv-mint", text: "text-tv-green-deep" },
  "Screening Salute": { bg: "bg-tv-bordeaux", text: "text-tv-cream" },
  "Corsi IT": { bg: "bg-tv-sky", text: "text-tv-cream" },
};

export const EventoDettaglio = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [signupCount, setSignupCount] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/events/${slug}`);
        setEvent(res.data);
        document.title = `${res.data.title} — APS Trama Viva`;
        // load social proof count (non-blocking)
        try {
          const c = await axios.get(`${API}/events/${slug}/signups-count`);
          setSignupCount(c.data.count);
        } catch {}
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
    return () => { document.title = "APS Trama Viva — Intrecciamo storie, persone, opportunità"; };
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Nome ed email sono obbligatori.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/event-signup`, {
        event_id: event.id,
        event_title: event.title,
        ...form,
      });
      setDone(true);
      setSignupCount((c) => (typeof c === "number" ? c + 1 : c));
      toast.success("Richiesta inviata! Ti scriviamo presto.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      toast.error("Errore nell'invio. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copy = async () => {
    // Try modern clipboard API first
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiato!");
        return;
      }
    } catch {}
    // Fallback for iframes / older browsers
    try {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Link copiato!");
    } catch {
      // Last resort: prompt user to copy manually
      window.prompt("Copia il link qui sotto:", shareUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tv-cream flex items-center justify-center">
        <Navbar />
        <div className="text-tv-green-deep/60">Caricamento…</div>
      </div>
    );
  }
  if (error || !event) {
    return (
      <div className="min-h-screen bg-tv-cream">
        <Navbar />
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <div className="text-6xl mb-4">🕸️</div>
          <h1 className="font-display font-black text-4xl text-tv-green-deep">Evento non trovato</h1>
          <p className="mt-3 text-tv-green-deep/70">
            Forse è stato annullato o l'URL è sbagliato. Torna agli eventi attivi.
          </p>
          <Link
            to="/"
            data-testid="event-not-found-back"
            className="btn-tv inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold"
          >
            <ArrowLeft size={16} /> Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  const cat = categoryColor[event.category] || { bg: "bg-tv-mint", text: "text-tv-green-deep" };

  return (
    <div className="min-h-screen bg-tv-cream">
      <Navbar />
      <article className="relative pt-32 pb-20 md:pt-40 overflow-hidden">
        <ThreadsBg className="absolute inset-0 w-full h-full" opacity={0.18} />
        <div className="relative mx-auto max-w-5xl px-6 md:px-10">
          <Link
            to="/#eventi"
            data-testid="event-back-link"
            className="inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep/70 hover:text-tv-green-deep mb-8"
          >
            <ArrowLeft size={16} /> Torna agli eventi
          </Link>

          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-7">
              <span
                className={`inline-block px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${cat.bg} ${cat.text}`}
                data-testid="event-detail-category"
              >
                {event.category}
              </span>
              <h1
                className="mt-5 font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-tv-green-deep"
                data-testid="event-detail-title"
              >
                {event.title}
              </h1>
              <div className="mt-8 text-7xl md:text-8xl">{event.emoji}</div>
              <p className="mt-8 text-lg md:text-xl text-tv-green-deep/80 leading-relaxed">
                {event.description}
              </p>

              {/* Share */}
              <div className="mt-10 flex flex-wrap items-center gap-3" data-testid="event-share">
                <span className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux flex items-center gap-1">
                  <Share2 size={14} /> Condividi
                </span>
                <button
                  onClick={copy}
                  data-testid="share-copy"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-tv-green-deep/15 hover:bg-tv-mint/30 text-sm font-semibold text-tv-green-deep"
                >
                  <Copy size={14} /> Copia link
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${event.title} — ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  data-testid="share-whatsapp"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-green text-tv-cream text-sm font-bold"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(event.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  data-testid="share-telegram"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-sky text-tv-cream text-sm font-bold"
                >
                  <Send size={14} /> Telegram
                </a>
              </div>
            </div>

            {/* Sidebar info + form */}
            <aside className="md:col-span-5 space-y-5">
              <div className="bg-tv-green-deep text-tv-cream rounded-[2rem] p-7">
                <div className="text-xs font-bold uppercase tracking-widest opacity-75">Quando</div>
                <div className="mt-1 font-display font-black text-2xl capitalize">
                  {fmtDate(event.date)}
                </div>
                <div className="mt-4 grid gap-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={15} /> {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={15} /> {event.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} /> {event.spots} posti disponibili
                  </div>
                </div>
                {typeof signupCount === "number" && signupCount >= 3 && (
                  <div
                    data-testid="event-social-proof"
                    className="mt-5 pt-5 border-t border-tv-cream/15 flex items-center gap-3"
                  >
                    <div className="flex -space-x-2">
                      {[0,1,2].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-tv-green-deep flex items-center justify-center text-xs font-bold"
                          style={{ background: ["#5CB176","#92C8B9","#F59E0B"][i], color: "#052F17" }}
                        >
                          {["A","B","C"][i]}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm font-semibold leading-tight">
                      <span className="text-tv-orange font-black">{signupCount}</span> {signupCount === 1 ? "persona ha già" : "persone hanno già"} chiesto di esserci
                    </div>
                  </div>
                )}
                {typeof signupCount === "number" && signupCount > 0 && signupCount < 3 && (
                  <div
                    data-testid="event-social-proof-early"
                    className="mt-5 pt-5 border-t border-tv-cream/15 text-sm opacity-90"
                  >
                    🌱 Sii tra i primi a chiedere di partecipare
                  </div>
                )}
              </div>

              {done ? (
                <div className="bg-tv-green text-tv-cream rounded-[2rem] p-7" data-testid="event-detail-success">
                  <div className="font-display font-black text-2xl">Ci sei!</div>
                  <p className="mt-2 text-sm opacity-90">
                    Abbiamo ricevuto la tua richiesta. Ti confermiamo entro 24h.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  data-testid="event-detail-form"
                  className="bg-white rounded-[2rem] p-7 border border-tv-green-deep/10"
                >
                  <div className="font-display font-black text-2xl text-tv-green-deep">
                    Partecipa
                  </div>
                  <p className="mt-1 text-sm text-tv-green-deep/60">
                    Mandaci la tua richiesta, ti rispondiamo noi.
                  </p>
                  <div className="mt-4 p-3 rounded-2xl bg-tv-mint/30 border border-tv-green-deep/10 text-xs text-tv-green-deep leading-relaxed">
                    ℹ️ La partecipazione è riservata ai <b>soci tesserati</b>. Se non lo sei ancora,{" "}
                    <Link to="/#iscrizione" className="underline font-bold hover:text-tv-bordeaux">
                      iscriviti prima qui
                    </Link>
                  </div>
                  <div className="mt-5 space-y-3">
                    <input
                      data-testid="detail-form-name"
                      required
                      placeholder="Nome e cognome"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
                    />
                    <input
                      data-testid="detail-form-email"
                      required
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
                    />
                    <input
                      data-testid="detail-form-phone"
                      placeholder="Telefono (opzionale)"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
                    />
                    <textarea
                      data-testid="detail-form-message"
                      placeholder="Una nota per noi (opzionale)"
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    data-testid="detail-form-submit"
                    className="btn-tv w-full mt-4 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
                  >
                    {submitting ? "Invio…" : "Invia richiesta"}
                  </button>
                </form>
              )}
            </aside>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default EventoDettaglio;
