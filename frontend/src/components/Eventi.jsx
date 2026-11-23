import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Calendar as CalendarIcon, MapPin, Clock, Users, ArrowRight, ChevronDown, X, LayoutGrid, CalendarDays, Star } from "lucide-react";
import { toast } from "sonner";
import { Calendar as DayCalendar } from "./ui/calendar";
import { it } from "date-fns/locale";
import { icsUrl, googleCalendarUrl } from "../utils/calendarUtils";
import { PrivacyCheckbox, RecaptchaNotice } from "./PrivacyCheckbox";
import { recaptchaHeaders, useRecaptcha, antiSpamMessage } from "../lib/recaptcha";
import { PRIVACY_VERSION } from "../lib/legal";
import { eventImgStyle, eventImgFit } from "../lib/eventImage";
import PlaceLink from "./PlaceLink";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
};

export const categoryColor = {
  "Laboratori Artistici": "bg-tv-orange text-tv-green-deep",
  "Eventi Sociali": "bg-tv-green text-tv-green-deep",
  "Passeggiate": "bg-tv-sky text-tv-green-deep",
  "Screening Salute": "bg-tv-bordeaux text-tv-cream",
  "Corsi IT": "bg-tv-sky text-tv-green-deep",
};

// Colori del calendario: stessa palette delle etichette categoria sulle card
const categoryDot = {
  "Laboratori Artistici": "#F99C2C",
  "Eventi Sociali": "#A7B94C",
  "Passeggiate": "#92C8B9",
  "Screening Salute": "#5D1723",
  "Corsi IT": "#8FC2E5",
};
// Categorie su fondo scuro: numero del giorno in crema invece che verde scuro
const darkCategories = new Set(["Screening Salute"]);

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isPast = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

// Eventi passati dal più recente al più vecchio (a parità di data, quello con l'orario più tardi prima)
export const sortPastDesc = (events) =>
  events
    .filter((e) => isPast(e.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date) || String(b.time || "").localeCompare(String(a.time || "")));

// Quanti eventi passati mostrare in homepage; gli altri stanno nella pagina /eventi/archivio
const PAST_PREVIEW = 4;
// Quanti prossimi eventi mostrare prima del pulsante "Mostra tutti"
const UPCOMING_PREVIEW = 6;

export const Eventi = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [doneEvent, setDoneEvent] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  useRecaptcha();
  const [soloSociError, setSoloSociError] = useState(false);
  const [view, setView] = useState("list");
  const [pickedDate, setPickedDate] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/events`);
        setEvents(res.data);
      } catch (e) {
        toast.error("Non siamo riusciti a caricare gli eventi.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Nome ed email sono obbligatori.");
      return;
    }
    if (!privacy) {
      toast.error("Per inviare la richiesta devi accettare l'informativa sulla privacy.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/event-signup`, {
        event_id: selected.id,
        event_title: selected.title,
        ...form,
        privacy_accepted: true,
        privacy_version: PRIVACY_VERSION,
      }, { headers: await recaptchaHeaders("event_signup") });
      setDoneEvent(selected);
      setForm({ name: user?.name || "", email: user?.email || "", phone: "", message: "" });
      setPrivacy(false);
    } catch (err) {
      if (err?.response?.status === 403) {
        setSoloSociError(true);
      } else {
        toast.error(antiSpamMessage(err) || "Qualcosa è andato storto. Riprova.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setSoloSociError(false);
    setPrivacy(false);
    setForm({ name: user?.name || "", email: user?.email || "", phone: "", message: "" });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      id="eventi"
      data-testid="eventi-section"
      className="relative py-12 md:py-16 bg-tv-cream scroll-mt-20"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-8 md:mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
                Prossimi eventi
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
              Allora<br />
              <span className="italic font-light text-tv-bordeaux">ci sei per il </span> prossimo evento?
            </h2>
          </div>
          <div className="text-tv-green-deep/75 max-w-sm">
            Clicca su un evento per mandare la tua richiesta di partecipazione. Ti
            confermiamo noi entro 24h.
          </div>
        </div>

        {loading ? (
          <div className="text-tv-green-deep/75" data-testid="events-loading">Caricamento…</div>
        ) : (
          <>
            {/* View toggle */}
            <div className="flex items-center gap-2 mb-8" data-testid="eventi-view-toggle">
              <button
                onClick={() => setView("list")}
                data-testid="eventi-view-list"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
                  view === "list"
                    ? "bg-tv-green-deep text-tv-cream"
                    : "bg-white text-tv-green-deep/75 hover:bg-tv-sky/30 border border-tv-green-deep/10"
                }`}
              >
                <LayoutGrid size={16} /> Lista
              </button>
              <button
                onClick={() => setView("calendar")}
                data-testid="eventi-view-calendar"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
                  view === "calendar"
                    ? "bg-tv-green-deep text-tv-cream"
                    : "bg-white text-tv-green-deep/75 hover:bg-tv-sky/30 border border-tv-green-deep/10"
                }`}
              >
                <CalendarDays size={16} /> Calendario
              </button>
            </div>

            {view === "list" ? (
              <ListView events={events} onParticipate={setSelected} />
            ) : (
              <CalendarView
                events={events}
                pickedDate={pickedDate}
                setPickedDate={setPickedDate}
                onParticipate={setSelected}
              />
            )}
            <MobilePastEvents events={events} />
          </>
        )}
      </div>

      {/* Participation modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] bg-tv-green-deep/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => { setSelected(null); setDoneEvent(null); }}
          data-testid="event-modal"
        >
          {doneEvent ? (
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-tv-green-deep text-tv-cream rounded-[2rem] p-7 md:p-9 relative my-4">
              <button aria-label="Chiudi" type="button" onClick={() => { setSelected(null); setDoneEvent(null); }}
                className="absolute top-5 right-5 p-2 rounded-full bg-tv-cream/20 hover:bg-tv-cream/30">
                <X aria-hidden="true" size={16} />
              </button>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-tv-cream/20 flex items-center justify-center text-4xl">✅</div>
              </div>
              <div className="font-display font-black text-2xl text-center">Richiesta inviata!</div>
              <p className="mt-2 text-sm opacity-90 text-center">Ti confermiamo la partecipazione entro 24h via email.</p>
              <div className="my-5 border-t border-tv-cream/30" />
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2"><span>📅</span><span className="font-semibold">{doneEvent.title}</span></div>
                {(doneEvent.date || doneEvent.time) && (
                  <div className="flex items-start gap-2"><span>🕐</span><span>{doneEvent.date ? new Date(doneEvent.date + 'T12:00:00').toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : ""}{doneEvent.date && doneEvent.time ? " · " : ""}{doneEvent.time || ""}</span></div>
                )}
                {doneEvent.location && <div className="flex items-start gap-2"><span>📍</span><span>{doneEvent.location}</span></div>}
              </div>
              <p className="mt-4 text-xs opacity-70">Aggiungi al calendario:</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <a href={icsUrl(doneEvent)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-cream/20 hover:bg-tv-cream/30 text-tv-cream font-bold text-xs transition-colors">
                  🍎 Apple
                </a>
                <a href={googleCalendarUrl(doneEvent)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-cream/20 hover:bg-tv-cream/30 text-tv-cream font-bold text-xs transition-colors">
                  G&nbsp; Google
                </a>
                <a href={icsUrl(doneEvent)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-cream/20 hover:bg-tv-cream/30 text-tv-cream font-bold text-xs transition-colors">
                  📧 Outlook
                </a>
              </div>
              <button onClick={() => { setSelected(null); setDoneEvent(null); }}
                className="mt-4 w-full px-4 py-3 rounded-full bg-tv-cream/10 hover:bg-tv-cream/20 text-tv-cream/80 font-bold text-sm transition-colors">
                Chiudi
              </button>
            </div>
          ) : (
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-lg bg-tv-cream rounded-[2rem] p-7 md:p-9 relative my-4"
          >
            <button aria-label="Chiudi"
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/85"
              data-testid="event-modal-close"
              aria-label="Chiudi"
            >
              <X aria-hidden="true" size={16} />
            </button>
            <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
              Partecipa a
            </div>
            <h3 className="mt-2 font-display font-black text-2xl md:text-3xl text-tv-green-deep leading-tight">
              {selected.title}
            </h3>
            <p className="mt-1 text-sm text-tv-green-deep/75">
              {fmtDate(selected.date)} · {selected.time} · {selected.location}
            </p>

            {/* Info solo soci */}
            {selected.solo_soci && (
              <div className="mt-3 p-3 rounded-2xl bg-tv-sky/40 border border-tv-green-deep/10 text-xs text-tv-green-deep leading-relaxed">
                ℹ️ Evento riservato ai soci. Inserisci l'email con cui sei registrato/a — oppure{" "}
                <a href="https://www.tramavivaaps.com/iscrizione" target="_blank" rel="noreferrer" className="underline font-bold hover:text-tv-bordeaux">iscriviti qui</a>.
              </div>
            )}

            {/* Consumazione al locale */}
            {selected.consumazione_struttura && (
              <div className="mt-3 p-3 rounded-2xl bg-tv-mint/30 border border-tv-green-deep/10 text-xs text-tv-green-deep font-semibold">
                ☕ Consumazione da pagare direttamente alla struttura
              </div>
            )}

            {/* Contributo info */}
            {selected.contributo > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-tv-orange/20 border border-tv-orange/30 text-xs text-tv-green-deep">
                <div className="font-semibold">💶 Contributo: {selected.contributo}€{selected.non_rimborsabile ? " · ⚠️ non rimborsabile" : ""}</div>
                {selected.contributo_note && <div className="mt-1 font-normal italic">{selected.contributo_note}</div>}
                <div className="mt-1 font-normal">
                  <a href="/condizioni" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-tv-bordeaux">
                    Condizioni di iscrizione, cancellazione e rimborso<span className="sr-only"> (si apre in una nuova scheda)</span>
                  </a>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <input
                data-testid="event-form-name"
                required
                aria-label="Nome e cognome"
                autoComplete="name"
                placeholder="Nome e cognome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
              />
              <input
                data-testid="event-form-email"
                required
                type="email"
                aria-label="Email"
                autoComplete="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
              />
              <input
                data-testid="event-form-phone"
                aria-label="Telefono (opzionale)"
                autoComplete="tel"
                placeholder="Telefono (opzionale)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
              />
              <textarea
                data-testid="event-form-message"
                aria-label="Una nota per noi (opzionale)"
                placeholder="Una nota per noi (opzionale)"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
              />
                <input
                 data-testid="detail-form-referral"
                 aria-label="Come hai saputo dell'evento (opzionale)"
                 placeholder="Come hai saputo dell'evento/Chi ti ha consigliato? (opzionale)"
                 value={form.referral || ""}
                 onChange={(e) => setForm({ ...form, referral: e.target.value })}
                 className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
               />
            </div>
            <PrivacyCheckbox
              id="event-privacy"
              className="mt-5"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              purpose="gestire la mia richiesta di partecipazione a questo evento"
            />
            <button
              type="submit"
              disabled={submitting}
              data-testid="event-form-submit"
              className="btn-tv w-full mt-5 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
            >
              {submitting ? "Invio in corso…" : "Invia richiesta"}
            </button>
            <RecaptchaNotice className="mt-3" />
            {soloSociError && (
              <div className="mt-3 p-4 rounded-2xl bg-tv-bordeaux/8 border border-tv-bordeaux/20 text-sm text-tv-green-deep leading-relaxed">
                <div className="font-bold text-tv-bordeaux mb-1">Evento riservato ai soci</div>
                <p className="text-xs text-tv-green-deep/75 mb-3">
                  La tua email non risulta tra i soci di Trama Viva. Per partecipare devi prima diventare socio.
                </p>
                <a
                  href="https://www.tramavivaaps.com/iscrizione"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-bold px-4 py-2 rounded-full bg-tv-bordeaux text-white hover:bg-tv-bordeaux/80 transition-colors"
                >
                  Richiedi l'iscrizione →
                </a>
              </div>
            )}
          </form>
          )}
        </div>
      )}
    </section>
  );
};

// Storico eventi su mobile (su desktop sta nell'hero), sotto sia Lista sia Calendario
const MobilePastEvents = ({ events }) => {
  const past = sortPastDesc(events);
  if (past.length === 0) return null;
  return (
    <div className="md:hidden">
          <div className="mt-16 mb-6 flex items-center gap-4">
            <div className="flex-1 border-t border-tv-green-deep/10" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-tv-green-deep/75">Storico eventi</span>
            <div className="flex-1 border-t border-tv-green-deep/10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {past.slice(0, PAST_PREVIEW).map((ev) => (
              <PastEventCard key={ev.id} ev={ev} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/eventi/archivio"
              data-testid="eventi-archivio-link"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-white text-tv-green-deep border border-tv-green-deep/15 hover:bg-tv-sky/30 transition-colors"
            >
              {past.length > PAST_PREVIEW
                ? `Vedi tutti i ${past.length} eventi passati`
                : "Vedi l'archivio degli eventi"}{" "}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
  );
};

// ---------- List view ----------
const ListView = ({ events, onParticipate }) => {
  const upcoming = events.filter((e) => !isPast(e.date));
  const featured = upcoming.find((e) => e.featured);
  const others = featured ? upcoming.filter((e) => e.id !== featured.id) : upcoming;
  const [showAll, setShowAll] = useState(false);
  const hiddenCount = Math.max(0, others.length - UPCOMING_PREVIEW);
  const visible = showAll ? others : others.slice(0, UPCOMING_PREVIEW);
  return (
    <>
      {featured && <FeaturedCard ev={featured} onParticipate={onParticipate} />}
      {others.length > 0 ? (
        <>
          <div id="eventi-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {visible.map((ev) => (
              <EventCard key={ev.id} ev={ev} onParticipate={onParticipate} />
            ))}
          </div>
          {hiddenCount > 0 && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                aria-controls="eventi-grid"
                data-testid="eventi-show-all"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/85 transition-colors"
              >
                {showAll
                  ? "Mostra meno eventi"
                  : `Mostra tutti i prossimi eventi (altri ${hiddenCount})`}
                <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${showAll ? "rotate-180" : ""}`} />
              </button>
            </div>
          )}
        </>
      ) : !featured && (
        <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/75">
          Nessun evento in programma al momento. Torna presto!
        </div>
      )}
    </>
  );
};

const FeaturedCard = ({ ev, onParticipate }) => (
  <article
    data-testid={`event-featured-${ev.id}`}
    className="relative bg-tv-green-deep text-tv-cream rounded-[2.5rem] p-7 md:p-12 mb-6 md:mb-8 overflow-hidden grid md:grid-cols-12 gap-8 items-center"
  >
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-tv-green/40 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-tv-sky/30 blur-3xl pointer-events-none" />
    <div className="relative md:col-span-7">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tv-orange text-tv-green-deep text-[11px] font-bold uppercase tracking-wider">
        <Star size={12} fill="currentColor" /> In evidenza · {ev.category}
      </div>
      <h3 className="mt-5 font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95]">
        {ev.title}
      </h3>
     {/* <p className="mt-4 text-base md:text-lg opacity-85 max-w-xl whitespace-pre-wrap">
        {ev.description}
      </p> */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2"><CalendarIcon size={15} /> {fmtDate(ev.date)}</div>
        {ev.time && <div className="flex items-center gap-2"><Clock size={15} /> {ev.time}</div>}
        {(ev.location || ev.maps_url) && <div className="flex items-center gap-2"><MapPin size={15} /> <PlaceLink place={ev.location} url={ev.maps_url} /></div>}
        {ev.spots <= 5 && (
          <div className="flex items-center gap-2">
            <Users size={15} />
            {ev.spots <= 0 ? (
              <span className="opacity-50">Posti esauriti</span>
            ) : ev.spots === 1 ? (
              <span className="font-bold text-tv-orange">⚡ Ultimo posto disponibile!</span>
            ) : (
              <span className="font-bold text-tv-orange">⚡ Ultimi {ev.spots} posti!</span>
            )}
          </div>
        )}
      </div>
      {ev.contributo > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
          💶 Contributo: {ev.contributo}€
        </div>
      )}
      <div className="mt-7">
        {ev.spots <= 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black tracking-[.18em] text-tv-cream/50 uppercase shrink-0">Sold out</span>
              <div className="w-10 border-t border-dashed border-tv-cream/20 shrink-0" />
              <Link to={`/eventi/${ev.slug || ev.id}`} data-testid={`event-featured-detail-${ev.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-tv-cream/65 border border-tv-cream/20 hover:text-tv-cream hover:border-tv-cream/50 transition-all">
                Vedi dettagli <ArrowRight size={14} />
              </Link>
            </div>
            <Link to={`/eventi/${ev.slug || ev.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-tv-cream/60 border border-tv-cream/20 hover:text-tv-cream hover:border-tv-cream/40 transition-all w-fit">
              ⏳ Lista di attesa
            </Link>
          </div>
        ) : (
          <Link to={`/eventi/${ev.slug || ev.id}`} data-testid={`event-featured-detail-${ev.id}`}
            className="btn-tv inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-tv-orange text-tv-green-deep hover:bg-tv-orange/80">
            Vedi dettagli e Partecipa <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
    <div className="relative md:col-span-5 flex items-center justify-center">
      {ev.has_image ? (
        <img src={ev.image_url || `${API}/events/${ev.id}/image`} alt={ev.title} loading="lazy" style={eventImgStyle(ev)} className={`w-full max-w-xs rounded-2xl ${eventImgFit(ev)} aspect-square ${ev.spots <= 0 ? "opacity-60 grayscale-[20%]" : ""}`} />
      ) : (
        <span className={`text-[10rem] md:text-[12rem] leading-none ${ev.spots <= 0 ? "opacity-50 grayscale" : ""}`}>{ev.emoji}</span>
      )}
    </div>
  </article>
);

const EventCard = ({ ev, onParticipate, compact = false, past = false }) => {
  const soldOut = !past && ev.spots <= 0;
  return (
    <article
      data-testid={`event-card-${ev.id}`}
      className={`group bg-white border rounded-[2rem] overflow-hidden ${
        compact ? "p-5" : "p-6"
      } flex flex-col transition-all duration-500 ${
        past
          ? "border-tv-green-deep/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_-10px_rgba(5,47,23,0.15)]"
          : soldOut
            ? "border-tv-bordeaux/25 hover:-translate-y-1 hover:shadow-[0_12px_40px_-15px_rgba(93,23,35,0.18)]"
            : "border-tv-green-deep/10 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(5,47,23,0.25)]"
      }`}
    >
      {!compact && ev.has_image && (
        <div className="-mx-6 -mt-6 mb-4 relative">
          <img src={ev.image_url || `${API}/events/${ev.id}/image`} alt={ev.title} loading="lazy" style={eventImgStyle(ev)} className={`w-full h-44 ${eventImgFit(ev)} ${soldOut ? "opacity-60 grayscale-[30%]" : ""}`} />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              categoryColor[ev.category] || "bg-tv-sky text-tv-green-deep"
            }`}
          >
            {ev.category}
          </span>
          {past && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tv-green-deep/10 text-tv-green-deep/75">
              Concluso
            </span>
          )}
          {soldOut && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[.12em] bg-tv-bordeaux/10 text-tv-bordeaux border border-tv-bordeaux/20">
              Sold out
            </span>
          )}
        </div>
      </div>
      <h3 className="font-display font-black text-xl md:text-2xl text-tv-green-deep leading-tight">
        {ev.title}
      </h3>
      <div className="mt-4 space-y-1.5 text-sm text-tv-green-deep/80">
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} /> {fmtDate(ev.date)}
        </div>
        {ev.time && (
          <div className="flex items-center gap-2">
            <Clock size={14} /> {ev.time}
          </div>
        )}
        {(ev.location || ev.maps_url) && (
          <div className="flex items-center gap-2">
            <MapPin size={14} /> <PlaceLink place={ev.location} url={ev.maps_url} />
          </div>
        )}
        {!compact && !past && ev.spots <= 5 && (
          <div className="flex items-center gap-2">
            <Users size={14} />
            {ev.spots <= 0 ? (
              <span className="text-tv-bordeaux/60">Posti esauriti</span>
            ) : ev.spots === 1 ? (
              <span className="text-orange-500 font-bold">⚡ Ultimo posto disponibile!</span>
            ) : (
              <span className="text-orange-500 font-bold">⚡ Ultimi {ev.spots} posti!</span>
            )}
          </div>
        )}
      </div>
      <div className="mt-auto pt-5">
        {soldOut ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black tracking-[.18em] text-tv-bordeaux uppercase shrink-0">Sold out</span>
              <div className="flex-1 border-t border-dashed border-tv-bordeaux/20" />
              <Link to={`/eventi/${ev.slug || ev.id}`} data-testid={`event-detail-${ev.id}`}
                className="text-sm font-bold text-tv-green-deep/75 hover:text-tv-green-deep transition-colors shrink-0 flex items-center gap-1">
                Vedi dettagli <ArrowRight size={13} />
              </Link>
            </div>
            <Link to={`/eventi/${ev.slug || ev.id}`}
              className="flex items-center justify-center gap-1.5 py-2 rounded-full border border-tv-green-deep/20 text-tv-green-deep/75 text-xs font-bold hover:border-tv-green-deep/40 hover:text-tv-green-deep transition-all">
              ⏳ Lista di attesa
            </Link>
          </div>
        ) : (
          <Link
            to={`/eventi/${ev.slug || ev.id}`}
            data-testid={`event-detail-${ev.id}`}
            className={`inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
              past
                ? "bg-tv-green-deep/5 border border-tv-green-deep/15 text-tv-green-deep hover:bg-tv-green-deep hover:text-tv-cream"
                : "btn-tv bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/85"
            }`}
          >
            {past ? "Vedi dettagli" : <>Vedi dettagli e Partecipa <ArrowRight size={16} /></>}
          </Link>
        )}
      </div>
    </article>
  );
};

export const PastEventCard = ({ ev }) => (
  <Link
    to={`/eventi/${ev.slug || ev.id}`}
    data-testid={`event-card-${ev.id}`}
    className="group bg-white border border-tv-green-deep/[0.08] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(5,47,23,0.15)] hover:border-tv-green-deep/20"
  >
    {ev.has_image ? (
      <div className="overflow-hidden h-28">
        <img
          src={ev.image_url || `${API}/events/${ev.id}/image`}
          alt={ev.title}
          loading="lazy"
          style={eventImgStyle(ev)}
          className={`w-full h-full ${eventImgFit(ev)} transition-all duration-500 group-hover:scale-105`}
        />
      </div>
    ) : (
      <div className="h-12 flex items-center justify-center pt-3">
        <span className="text-3xl opacity-35 group-hover:opacity-55 transition-opacity">{ev.emoji}</span>
      </div>
    )}
    <div className="p-3.5 flex flex-col flex-1">
      <span className={`self-start px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mb-2 ${categoryColor[ev.category] || "bg-tv-sky text-tv-green-deep"}`}>
        {ev.category}
      </span>
      <h3 className="font-display font-black text-sm leading-tight text-tv-green-deep/75 group-hover:text-tv-green-deep transition-colors">
        {ev.title}
      </h3>
      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-tv-green-deep/75">
        <CalendarIcon size={10} />
        {new Date(ev.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
      </div>
      <div className="mt-auto pt-3 flex items-center justify-end">
        <ArrowRight size={13} className="text-tv-green-deep/20 group-hover:text-tv-green-deep/75 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  </Link>
);

// ---------- Calendar view ----------
// Anteprima evento grande per la vista calendario: foto a sinistra, dettagli a destra
const CalendarPreviewCard = ({ ev }) => {
  const past = isPast(ev.date);
  const soldOut = !past && ev.spots <= 0;
  const excerpt = (ev.description || "").replace(/\*{1,3}([^*\n]+?)\*{1,3}/g, "$1").trim();
  return (
    <article
      data-testid={`calendar-preview-${ev.id}`}
      className="group bg-white border border-tv-green-deep/10 rounded-[2rem] overflow-hidden flex flex-col sm:flex-row transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(5,47,23,0.25)]"
    >
      <Link to={`/eventi/${ev.slug || ev.id}`} className="sm:w-[42%] shrink-0 relative block bg-tv-green-deep/[0.05]" tabIndex={-1} aria-hidden="true">
        {ev.has_image ? (
          <img
            src={ev.image_url || `${API}/events/${ev.id}/image`}
            alt=""
            loading="lazy"
            style={eventImgStyle(ev)}
            className={`w-full h-52 sm:h-full sm:min-h-[240px] ${eventImgFit(ev)} ${past || soldOut ? "opacity-70 grayscale-[30%]" : ""}`}
          />
        ) : (
          <div className="w-full h-40 sm:h-full flex items-center justify-center text-6xl opacity-40">{ev.emoji}</div>
        )}
      </Link>
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryColor[ev.category] || "bg-tv-sky text-tv-green-deep"}`}>
            {ev.category}
          </span>
          {past && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tv-green-deep/10 text-tv-green-deep/75">Concluso</span>
          )}
          {soldOut && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tv-bordeaux/10 text-tv-bordeaux">Sold out</span>
          )}
        </div>
        <h3 className="font-display font-black text-2xl text-tv-green-deep leading-tight">
          <Link to={`/eventi/${ev.slug || ev.id}`} className="hover:underline underline-offset-4">{ev.title}</Link>
        </h3>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-tv-green-deep/80">
          <span className="flex items-center gap-1.5"><CalendarIcon size={14} aria-hidden="true" /> {fmtDate(ev.date)}</span>
          {ev.time && <span className="flex items-center gap-1.5"><Clock size={14} aria-hidden="true" /> {ev.time}</span>}
          {(ev.location || ev.maps_url) && (
            <span className="flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" /> <PlaceLink place={ev.location} url={ev.maps_url} /></span>
          )}
        </div>
        {excerpt && (
          <p className="mt-3 text-sm text-tv-green-deep/75 leading-relaxed line-clamp-3">{excerpt}</p>
        )}
        {!past && ev.spots > 0 && ev.spots <= 5 && (
          <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-tv-bordeaux">
            <Users size={14} aria-hidden="true" /> {ev.spots === 1 ? "Ultimo posto disponibile!" : `Ultimi ${ev.spots} posti!`}
          </div>
        )}
        <div className="mt-auto pt-5">
          <Link
            to={`/eventi/${ev.slug || ev.id}`}
            data-testid={`calendar-preview-detail-${ev.id}`}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-colors ${
              past || soldOut
                ? "bg-tv-green-deep/5 border border-tv-green-deep/15 text-tv-green-deep hover:bg-tv-green-deep hover:text-tv-cream"
                : "bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/85"
            }`}
          >
            {past ? "Vedi dettagli" : soldOut ? "Vedi dettagli e lista d'attesa" : "Vedi dettagli e Partecipa"} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
};

const CalendarView = ({ events, pickedDate, setPickedDate, onParticipate }) => {
  const eventDates = useMemo(
    () => events.map((e) => ({ date: new Date(e.date), category: e.category })),
    [events]
  );

  // Default month: month of the first upcoming event, or today
  const defaultMonth = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .map((e) => new Date(e.date))
      .filter((d) => d >= new Date(now.getFullYear(), now.getMonth(), 1))
      .sort((a, b) => a - b);
    return upcoming[0] || now;
  }, [events]);

  const eventsForPicked = pickedDate
    ? events.filter((e) => sameDay(new Date(e.date), pickedDate))
    : [];
  // Senza giorno scelto: anteprima dei prossimi eventi
  const nextEvents = useMemo(
    () => events.filter((e) => !isPast(e.date)).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3),
    [events]
  );

  // Modifiers for react-day-picker: one per category
  const modifiers = useMemo(() => {
    const m = { hasEvent: eventDates.map((e) => e.date) };
    Object.keys(categoryDot).forEach((cat) => {
      m[`cat-${cat}`] = eventDates.filter((e) => e.category === cat).map((e) => e.date);
    });
    return m;
  }, [eventDates]);

  // Giorno con eventi: casella piena col colore della categoria.
  // Più categorie nello stesso giorno → casella divisa in diagonale.
  const renderDay = (day, activeModifiers = {}) => {
    const dayEvents = events.filter((e) => sameDay(new Date(e.date), day));
    if (dayEvents.length === 0) return <span>{day.getDate()}</span>;

    const cats = [...new Set(dayEvents.map((e) => e.category))].slice(0, 3);
    const colors = cats.map((c) => categoryDot[c] || categoryDot["Eventi Sociali"]);
    const step = 100 / colors.length;
    const background = colors.length === 1
      ? colors[0]
      : `linear-gradient(135deg, ${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
    const past = isPast(dayEvents[0].date);
    // Giorni passati: colore attenuato ma numero ben leggibile
    const darkText = !past && cats.length === 1 && darkCategories.has(cats[0]);

    return (
      <span
        className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden transition group-hover:brightness-95"
      >
        <span aria-hidden="true" className="absolute inset-0" style={{ background, opacity: past ? 0.35 : 1 }} />
        {activeModifiers.selected && (
          <span aria-hidden="true" className="absolute inset-0 rounded-xl shadow-[inset_0_0_0_3px_#2D3A18,inset_0_0_0_5px_#fff]" />
        )}
        <span
          className={`relative font-black ${darkText ? "text-tv-cream" : past ? "text-tv-green-deep/75" : "text-tv-green-deep"} ${
            activeModifiers.today ? "underline underline-offset-4 decoration-2" : ""
          }`}
        >
          {day.getDate()}
        </span>
      </span>
    );
  };

  return (
    <div className="grid md:grid-cols-12 gap-6 md:gap-8" data-testid="eventi-calendar">
      <div className="md:col-span-5 lg:col-span-4 self-start md:sticky md:top-28 bg-white rounded-[2rem] p-4 md:p-5 border border-tv-green-deep/10">
        <DayCalendar
          mode="single"
          locale={it}
          weekStartsOn={1}
          defaultMonth={defaultMonth}
          selected={pickedDate}
          onSelect={setPickedDate}
          modifiers={modifiers}
          modifiersClassNames={{
            hasEvent: "font-bold text-tv-green-deep",
          }}
          components={{ DayContent: ({ date, activeModifiers }) => renderDay(date, activeModifiers) }}
          className="tv-calendar mx-auto"
          classNames={{
            months: "flex flex-col items-center w-full",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center mb-2",
            caption_label: "text-base font-display font-black text-tv-green-deep capitalize",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-8 w-8 bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky rounded-full inline-flex items-center justify-center transition-colors",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex w-full",
            head_cell:
              "flex-1 text-tv-green-deep/75 font-bold text-[11px] uppercase tracking-wider py-2",
            row: "flex w-full mt-1",
            cell: "flex-1 aspect-square text-center text-[13px] relative p-0.5",
            day: "group relative h-full w-full inline-flex items-center justify-center rounded-xl text-tv-green-deep hover:bg-tv-sky/40 transition-colors aria-selected:opacity-100",
            day_selected:
              "bg-tv-green-deep !text-tv-cream font-bold hover:bg-tv-green-deep hover:!text-tv-cream",
            day_today: "bg-tv-green-deep/10 font-bold",
            day_outside: "text-tv-green-deep/25",
            day_disabled: "text-tv-green-deep/25 opacity-50",
            day_hidden: "invisible",
          }}
        />
        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 justify-center">
          {Object.entries(categoryDot).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-tv-green-deep/75">
              <span className="block w-3 h-3 rounded" style={{ backgroundColor: color }} />
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-7 lg:col-span-8 space-y-4" aria-live="polite">
        {!pickedDate ? (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">In arrivo</div>
              <div className="text-xs text-tv-green-deep/75" data-testid="calendar-no-selection">
                Tocca un giorno colorato per vedere i suoi eventi.
              </div>
            </div>
            {nextEvents.length > 0 ? (
              nextEvents.map((ev) => <CalendarPreviewCard key={ev.id} ev={ev} />)
            ) : (
              <div className="rounded-[2rem] p-8 bg-white border border-tv-green-deep/10 text-tv-green-deep/75">
                Nessun evento in programma al momento. Torna presto!
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
                {pickedDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <button
                type="button"
                onClick={() => setPickedDate(undefined)}
                className="text-xs font-bold text-tv-green-deep underline underline-offset-4 hover:text-tv-bordeaux"
              >
                Mostra i prossimi eventi
              </button>
            </div>
            {eventsForPicked.length === 0 ? (
              <div className="rounded-[2rem] p-8 bg-white border border-tv-green-deep/10 text-tv-green-deep" data-testid="calendar-no-events">
                <div className="font-display font-black text-2xl leading-tight">Niente eventi questo giorno.</div>
                <div className="mt-2 text-sm text-tv-green-deep/75">
                  Ma se hai un'idea, proponicela: la prossima trama la tessiamo insieme.
                </div>
              </div>
            ) : (
              <div className="space-y-4" data-testid="calendar-events-list">
                {eventsForPicked.map((ev) => <CalendarPreviewCard key={ev.id} ev={ev} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Eventi;
