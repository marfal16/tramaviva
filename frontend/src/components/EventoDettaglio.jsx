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
  "Laboratori & Eventi Sociali": { bg: "bg-tv-orange", text: "text-tv-green-deep" },
  "Laboratori Artistici": { bg: "bg-tv-orange", text: "text-tv-green-deep" },
  "Eventi Sociali": { bg: "bg-tv-green", text: "text-tv-cream" },
  "Passeggiate": { bg: "bg-tv-mint", text: "text-tv-green-deep" },
  "Screening Salute": { bg: "bg-tv-bordeaux", text: "text-tv-cream" },
  "Corsi IT": { bg: "bg-tv-sky", text: "text-tv-cream" },
};

const isPast = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

export const EventoDettaglio = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", referral: "", metodo_pagamento: "" });
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
    if (event.contributo > 0 && !form.metodo_pagamento) {
      toast.error("Seleziona il metodo di pagamento.");
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
      setForm({ name: "", email: "", phone: "", message: "", referral: "", metodo_pagamento: "" });
    } catch {
      toast.error("Errore nell'invio. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyIban = async () => {
    const iban = "IT48E3688801600100000059432";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(iban);
        toast.success("IBAN copiato!");
        return;
      }
    } catch {}
    window.prompt("Copia l'IBAN qui sotto:", iban);
  };

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
              {event.has_image && (
                <img
                  src={`${API}/events/${event.id}/image`}
                  alt={event.title}
                  className="w-full h-64 md:h-80 object-cover rounded-[2rem] mb-6"
                />
              )}
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
              {/* <div className="mt-8 text-7xl md:text-8xl">{event.emoji}</div> */}
              <p className="mt-8 text-lg md:text-xl text-tv-green-deep/80 leading-relaxed whitespace-pre-wrap">
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
                    {/*
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
                   */}
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
                  
                  {event.contributo > 0 ? (
                    <div className="flex items-center gap-2">
                      💶 Contributo: {event.contributo}€
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      💚 Evento gratuito
                    </div>
                  )}
                  
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

              {isPast(event.date) ? (
                <div className="bg-tv-green-deep/5 border border-tv-green-deep/15 rounded-[2rem] p-7 text-center" data-testid="event-detail-past">
                  <div className="text-4xl mb-3">📁</div>
                  <div className="font-display font-black text-2xl text-tv-green-deep">Evento concluso</div>
                  <p className="mt-2 text-sm text-tv-green-deep/60 leading-relaxed">
                    Questo evento si è già svolto. Resta aggiornato sui prossimi appuntamenti!
                  </p>
                  <Link
                    to="/#eventi"
                    className="btn-tv mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm"
                  >
                    Vedi i prossimi eventi
                  </Link>
                </div>
              ) : done ? (
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
                  {event.solo_soci && (
                  <div className="mt-4 p-3 rounded-2xl bg-tv-sky/40 border border-tv-green-deep/10 text-xs text-tv-green-deep leading-relaxed">
                    ℹ️ La partecipazione è riservata ai <b>soci tesserati</b>. Se non lo sei ancora,{" "}
                    <Link to="/#iscrizione" className="underline font-bold hover:text-tv-bordeaux">
                      iscriviti prima qui
                    </Link>
                  </div>
                  )}
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
                    <input
                      data-testid="detail-form-referral"
                      placeholder="Come hai saputo dell'evento/Chi ti ha consigliato? (opzionale)"
                      value={form.referral || ""}
                      onChange={(e) => setForm({ ...form, referral: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
                    />
                  </div>
                  {event.contributo > 0 && (
                    <div className="pt-3 border-t border-tv-green-deep/10 space-y-3">
                      {event.contributo_note && (
                        <p className="text-xs text-tv-green-deep/70 italic">📝 {event.contributo_note}</p>
                      )}
                      {event.non_rimborsabile && (
                        <div className="p-3 rounded-2xl bg-tv-orange/20 border border-tv-orange/40 text-xs text-tv-green-deep font-semibold">
                          ⚠️ Il contributo di {event.contributo}€ <strong>non è rimborsabile</strong>.
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">
                          Metodo di pagamento *
                        </div>
                        <div className="flex gap-2">
                          {["contanti", "bonifico"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setForm({ ...form, metodo_pagamento: opt })}
                              className={`flex-1 px-3 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                                form.metodo_pagamento === opt
                                  ? "border-tv-green bg-tv-green/10 text-tv-green-deep"
                                  : "border-tv-green-deep/15 bg-tv-cream/40 text-tv-green-deep/60 hover:border-tv-green-deep/30"
                              }`}
                            >
                              {opt === "contanti" ? "💵 Contanti" : "🏦 Bonifico"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {form.metodo_pagamento === "bonifico" && (
                        <div className="p-3 rounded-2xl bg-tv-cream border border-tv-green-deep/15">
                          <div className="text-xs font-bold text-tv-green-deep/60 mb-1">IBAN Trama Viva APS</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-tv-green-deep font-bold flex-1 break-all">
                              IT48E3688801600100000059432
                            </code>
                            <button
                              type="button"
                              onClick={copyIban}
                              className="flex-shrink-0 p-1.5 rounded-xl bg-tv-green-deep/10 hover:bg-tv-green-deep/20 text-tv-green-deep transition-colors"
                              title="Copia IBAN"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                          <div className="text-xs text-tv-green-deep/50 mt-1">
                            Causale: {event.contributo_note || event.title}{form.name ? ` — ${form.name}` : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
