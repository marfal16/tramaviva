import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ArrowLeft, Share2, Send, Copy, MessageCircle, BookOpen, ArrowRight } from "lucide-react";
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
  const [numPersone, setNumPersone] = useState(1);
  const [ospiti, setOspiti] = useState([]);
  const [opzioneScelta, setOpzioneScelta] = useState("");
  const [donazioneVolontaria, setDonazioneVolontaria] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [signupCount, setSignupCount] = useState(null);

  const handleNumPersone = (n) => {
    setNumPersone(n);
    setOspiti(prev => Array.from({ length: n - 1 }, (_, i) => prev[i] || { nome: "", cognome: "", phone: "", email: "" }));
  };

  const updateOspite = (i, field, val) => {
    setOspiti(prev => { const next = [...prev]; next[i] = { ...next[i], [field]: val }; return next; });
  };

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
    const needsPayment = event.contributo > 0 || (event.contributo_volontario && parseFloat(donazioneVolontaria) > 0);
    if (needsPayment && !form.metodo_pagamento) {
      toast.error("Seleziona il metodo di pagamento.");
      return;
    }
    if (event.opzioni_custom && !opzioneScelta) {
      toast.error("Seleziona un'opzione.");
      return;
    }
    if (numPersone > 1 && ospiti.some(g => !g.nome || !g.cognome)) {
      toast.error("Inserisci nome e cognome per ogni persona.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/event-signup`, {
        event_id: event.id,
        event_title: event.title,
        ...form,
        num_persone: numPersone,
        ospiti: ospiti.slice(0, numPersone - 1),
        opzione_scelta: opzioneScelta || null,
        donazione_volontaria: donazioneVolontaria ? parseFloat(donazioneVolontaria) : null,
      });
      const signupId = res.data.id;

      if (form.metodo_pagamento === "elettronico") {
        const amount = event.contributo > 0
          ? event.contributo * numPersone
          : parseFloat(donazioneVolontaria) || 0;
        if (amount > 0) {
          try {
            toast.info("Generazione link di pagamento...");
            const payRes = await axios.post(`${API}/payments/create-checkout`, {
              amount,
              email: form.email,
              description: `${event.contributo_note || event.title} — ${form.name}`,
              registration_id: signupId,
            });
            if (payRes.data.checkout_url) {
              window.location.href = payRes.data.checkout_url;
              return;
            }
          } catch {}
        }
      }

      setDone(true);
      setSignupCount((c) => (typeof c === "number" ? c + 1 : c));
      toast.success("Richiesta inviata! Ti scriviamo presto.");
      setForm({ name: "", email: "", phone: "", message: "", referral: "", metodo_pagamento: "" });
      setNumPersone(1); setOspiti([]); setOpzioneScelta(""); setDonazioneVolontaria("");
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

              {/* Club del Libro banner */}
              {event.title?.toLowerCase().includes("club del libro") && (
                <Link
                  to="/club-del-libro"
                  className="group mt-10 flex items-center gap-4 rounded-[2rem] bg-tv-green-deep/[0.05] border border-tv-green-deep/12 px-5 py-4 hover:bg-tv-green-deep/10 hover:border-tv-green-deep/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl bg-tv-green-deep flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-tv-cream" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-tv-green-deep/40 mb-0.5">Club del Libro · Trama Viva</div>
                    <div className="font-bold text-tv-green-deep text-sm leading-tight">
                      Questo è un evento del nostro club di lettura mensile.
                    </div>
                    <div className="text-xs text-tv-green-deep/50 mt-0.5">Proposte, recensioni, biblioteca condivisa — scopri come funziona.</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-tv-green-deep/50 group-hover:text-tv-green-deep transition-colors shrink-0">
                    Scopri il club <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              )}

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
                    <Users size={15} />
                    {event.spots <= 0 ? (
                      <span className="font-bold">🔴 Posti esauriti</span>
                    ) : event.spots <= 5 ? (
                      <span className="font-bold text-orange-300">⚡ Ultimi {event.spots} posti!</span>
                    ) : (
                      <>{event.spots} posti disponibili</>
                    )}
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
              ) : event.spots <= 0 ? (
                <div className="bg-tv-green-deep/5 border border-tv-green-deep/15 rounded-[2rem] p-7 text-center" data-testid="event-detail-soldout">
                  <div className="text-4xl mb-3">🎟️</div>
                  <div className="font-display font-black text-2xl text-tv-green-deep">Posti esauriti</div>
                  <p className="mt-2 text-sm text-tv-green-deep/60 leading-relaxed">
                    Purtroppo tutti i posti per questo evento sono stati prenotati. Tieni d'occhio i prossimi appuntamenti!
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
                  <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-tv-cream/20 flex items-center justify-center text-4xl">
                      ✅
                    </div>
                  </div>
                  <div className="font-display font-black text-2xl text-center">Richiesta inviata!</div>
                  <p className="mt-2 text-sm opacity-90 text-center">
                    Ti confermiamo la partecipazione entro 24h via email.
                  </p>
                  <div className="my-5 border-t border-tv-cream/30" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span>📅</span>
                      <span className="font-semibold">{event.title}</span>
                    </div>
                    {(event.date || event.time) && (
                      <div className="flex items-start gap-2">
                        <span>🕐</span>
                        <span>
                          {event.date ? fmtDate(event.date) : ""}
                          {event.date && event.time ? " · " : ""}
                          {event.time || ""}
                        </span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-start gap-2">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-5 text-xs opacity-75 leading-relaxed">
                    Nel frattempo, controlla la tua casella email per una copia della richiesta.
                  </p>
                  <Link
                    to="/eventi"
                    className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tv-cream/20 hover:bg-tv-cream/30 text-tv-cream font-bold text-sm transition-colors"
                  >
                    Vedi altri eventi
                  </Link>
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

                  {/* Quante persone */}
                  <div className="mt-4 pt-4 border-t border-tv-green-deep/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">Quante persone partecipano?</div>
                    <div className="flex gap-2 flex-wrap">
                      {[1,2,3,4,5,6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleNumPersone(n)}
                          className={`w-10 h-10 rounded-2xl border-2 font-bold text-sm transition-all ${
                            numPersone === n
                              ? "border-tv-green bg-tv-green/10 text-tv-green-deep"
                              : "border-tv-green-deep/15 text-tv-green-deep/60 hover:border-tv-green-deep/30"
                          }`}
                        >{n}</button>
                      ))}
                    </div>
                  </div>

                  {/* Dati ospiti */}
                  {ospiti.map((g, i) => (
                    <div key={i} className="mt-4 pt-4 border-t border-tv-green-deep/10">
                      <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">
                        Persona {i + 2}
                      </div>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input required placeholder="Nome *" value={g.nome} onChange={e => updateOspite(i, "nome", e.target.value)} className="px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" />
                          <input required placeholder="Cognome *" value={g.cognome} onChange={e => updateOspite(i, "cognome", e.target.value)} className="px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" />
                        </div>
                        <input placeholder="Email (opzionale)" type="email" value={g.email} onChange={e => updateOspite(i, "email", e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" />
                        <input placeholder="Telefono (opzionale)" value={g.phone} onChange={e => updateOspite(i, "phone", e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" />
                      </div>
                    </div>
                  ))}

                  {/* Opzione personalizzata evento */}
                  {event.opzioni_custom && (
                    <div className="mt-4 pt-4 border-t border-tv-green-deep/10">
                      <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">
                        {event.opzioni_label || "Seleziona un'opzione"} *
                      </div>
                      <div className="flex flex-col gap-2">
                        {event.opzioni_custom.split(",").map(opt => opt.trim()).filter(Boolean).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setOpzioneScelta(opt)}
                            className={`px-4 py-3 rounded-2xl border-2 text-sm text-left transition-all ${
                              opzioneScelta === opt
                                ? "border-tv-green bg-tv-green/10 text-tv-green-deep font-bold"
                                : "border-tv-green-deep/15 bg-tv-cream/40 text-tv-green-deep/70 hover:border-tv-green-deep/30"
                            }`}
                          >
                            {opzioneScelta === opt ? "✓ " : ""}{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contributo volontario */}
                  {event.contributo_volontario && (
                    <div className="mt-4 pt-4 border-t border-tv-green-deep/10">
                      <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Contributo volontario all'associazione</div>
                      <p className="text-xs text-tv-green-deep/60 mb-2">Facoltativo — ogni cifra è benvenuta 💚</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Es. 5"
                          value={donazioneVolontaria}
                          onChange={e => setDonazioneVolontaria(e.target.value)}
                          className="w-full px-4 py-3 pr-10 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-tv-green-deep/50 font-bold">€</span>
                      </div>
                      {parseFloat(donazioneVolontaria) > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">Come vuoi pagare? *</div>
                          <div className="flex gap-2">
                            {[
                              { v: "contanti", label: "💵 Contanti" },
                              { v: "bonifico", label: "🏦 Bonifico" },
                              { v: "elettronico", label: "💳 Carta" },
                            ].map(({ v, label }) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setForm({ ...form, metodo_pagamento: v })}
                                className={`flex-1 px-2 py-2.5 rounded-2xl border-2 text-xs font-bold transition-all ${
                                  form.metodo_pagamento === v
                                    ? "border-tv-green bg-tv-green/10 text-tv-green-deep"
                                    : "border-tv-green-deep/15 bg-tv-cream/40 text-tv-green-deep/60 hover:border-tv-green-deep/30"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          {form.metodo_pagamento === "bonifico" && (
                            <div className="mt-2 p-3 rounded-2xl bg-tv-cream border border-tv-green-deep/15">
                              <div className="text-xs font-bold text-tv-green-deep/60 mb-1">IBAN Trama Viva APS</div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-tv-green-deep font-bold flex-1 break-all">IT48E3688801600100000059432</code>
                                <button type="button" onClick={copyIban} className="flex-shrink-0 p-1.5 rounded-xl bg-tv-green-deep/10 hover:bg-tv-green-deep/20 text-tv-green-deep transition-colors" title="Copia IBAN">
                                  <Copy size={13} />
                                </button>
                              </div>
                              <div className="text-xs text-tv-green-deep/50 mt-1">
                                Causale: Donazione {event.title}{form.name ? ` — ${form.name}` : ""}
                              </div>
                            </div>
                          )}
                          {form.metodo_pagamento === "elettronico" && (
                            <div className="mt-2 p-3 rounded-2xl bg-tv-cream border border-tv-green-deep/15">
                              <div className="text-xs font-bold text-tv-green-deep/60 mb-1">Pagamento sicuro via SumUp</div>
                              <div className="text-xs text-tv-green-deep/70">
                                Dopo aver inviato la richiesta, sarai reindirizzato al pagamento online.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
                          {[
                            { v: "contanti", label: "💵 Contanti" },
                            { v: "bonifico", label: "🏦 Bonifico" },
                            { v: "elettronico", label: "💳 Carta" },
                          ].map(({ v, label }) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setForm({ ...form, metodo_pagamento: v })}
                              className={`flex-1 px-3 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                                form.metodo_pagamento === v
                                  ? "border-tv-green bg-tv-green/10 text-tv-green-deep"
                                  : "border-tv-green-deep/15 bg-tv-cream/40 text-tv-green-deep/60 hover:border-tv-green-deep/30"
                              }`}
                            >
                              {label}
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
                      {form.metodo_pagamento === "elettronico" && (
                        <div className="p-3 rounded-2xl bg-tv-cream border border-tv-green-deep/15">
                          <div className="text-xs font-bold text-tv-green-deep/60 mb-1">Pagamento sicuro via SumUp</div>
                          <div className="text-xs text-tv-green-deep/70">
                            Dopo aver inviato la richiesta, sarai reindirizzato al pagamento online.
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
