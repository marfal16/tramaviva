import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Calendar as CalendarIcon, MapPin, Clock, Users, ArrowRight, X, LayoutGrid, CalendarDays, Star } from "lucide-react";
import { toast } from "sonner";
import { Calendar as DayCalendar } from "./ui/calendar";
import { it } from "date-fns/locale";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
};

const categoryColor = {
  "Laboratori Artistici": "bg-tv-orange text-tv-green-deep",
  "Eventi Sociali": "bg-tv-green text-tv-cream",
  "Passeggiate": "bg-tv-sky text-tv-green-deep",
  "Screening Salute": "bg-tv-bordeaux text-tv-cream",
  "Corsi IT": "bg-tv-sky text-tv-cream",
};

const categoryDot = {
  "Laboratori Artistici": "#F59E0B",
  "Eventi Sociali": "#5CB176",
  "Passeggiate": "#92C8B9",
  "Screening Salute": "#551118",
  "Corsi IT": "#429DD0",
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isPast = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

export const Eventi = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
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

  const nextEvent = useMemo(() => {
    return events
      .filter(ev => !isPast(ev.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
  }, [events]);

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!nextEvent) return;
    const calc = () => {
      const now = new Date();
      const target = new Date(nextEvent.date);
      target.setHours(
        nextEvent.time ? parseInt(nextEvent.time.split(':')[0]) : 9,
        nextEvent.time ? parseInt(nextEvent.time.split(':')[1]) : 0,
        0, 0
      );
      const diff = target - now;
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  const isToday = nextEvent ? sameDay(new Date(nextEvent.date), new Date()) : false;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Nome ed email sono obbligatori.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/event-signup`, {
        event_id: selected.id,
        event_title: selected.title,
        ...form,
      });
      toast.success("Richiesta inviata! Ti scriviamo presto.");
      setSelected(null);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (e) {
      toast.error("Qualcosa è andato storto. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="eventi"
      data-testid="eventi-section"
      className="relative py-24 md:py-32 bg-tv-cream"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-14">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
                Prossimi eventi
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
              Allora<br />
              <span className="italic font-light text-tv-bordeaux">ci sei per il </span> prossimo evento?
            </h2>
          </div>
          <div className="text-tv-green-deep/70 max-w-sm">
            Clicca su un evento per mandare la tua richiesta di partecipazione. Ti
            confermiamo noi entro 24h.
          </div>
        </div>

        {loading ? (
          <div className="text-tv-green-deep/60" data-testid="events-loading">Caricamento…</div>
        ) : (
          <>
            {/* Prossimo evento countdown widget */}
            {nextEvent && nextEvent.date && (
              <div className="bg-tv-green-deep text-tv-cream rounded-[2rem] px-6 py-5 mb-8 flex items-center gap-6 flex-wrap">
                {/* Left: emoji + title + date */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-tv-cream/10 flex items-center justify-center text-2xl shrink-0">
                    📅
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-widest text-tv-cream/60 mb-0.5">Prossimo evento</div>
                    <div className="font-display font-black text-xl leading-tight truncate">{nextEvent.title}</div>
                    <div className="text-sm text-tv-cream/70">{fmtDate(nextEvent.date)}</div>
                  </div>
                </div>
                {/* Right: countdown or "È oggi!" + Partecipa link */}
                <div className="flex items-center gap-4 flex-wrap">
                  {isToday ? (
                    <span className="font-display font-black text-2xl">È oggi! 🎉</span>
                  ) : timeLeft ? (
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { val: timeLeft.days, label: 'giorni' },
                        { val: timeLeft.hours, label: 'ore' },
                        { val: timeLeft.minutes, label: 'minuti' },
                        { val: timeLeft.seconds, label: 'secondi' },
                      ].map(({ val, label }) => (
                        <div className="text-center" key={label}>
                          <div className="font-display font-black text-2xl">{String(val).padStart(2, '0')}</div>
                          <div className="text-[10px] uppercase text-tv-cream/60">{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    to={`/eventi/${nextEvent.slug || nextEvent.id}`}
                    className="ml-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-cream text-tv-green-deep font-bold text-sm hover:bg-tv-orange transition-colors shrink-0"
                  >
                    Partecipa
                  </Link>
                </div>
              </div>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-2 mb-8" data-testid="eventi-view-toggle">
              <button
                onClick={() => setView("list")}
                data-testid="eventi-view-list"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
                  view === "list"
                    ? "bg-tv-green-deep text-tv-cream"
                    : "bg-white text-tv-green-deep/70 hover:bg-tv-sky/30 border border-tv-green-deep/10"
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
                    : "bg-white text-tv-green-deep/70 hover:bg-tv-sky/30 border border-tv-green-deep/10"
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
          </>
        )}
      </div>

      {/* Participation modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] bg-tv-green-deep/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setSelected(null)}
          data-testid="event-modal"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-lg bg-tv-cream rounded-[2rem] p-7 md:p-9 relative my-4"
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-tv-green-deep text-tv-cream hover:bg-tv-green"
              data-testid="event-modal-close"
              aria-label="Chiudi"
            >
              <X size={16} />
            </button>
            <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
              Partecipa a
            </div>
            <h3 className="mt-2 font-display font-black text-2xl md:text-3xl text-tv-green-deep leading-tight">
              {selected.title}
            </h3>
            <p className="mt-1 text-sm text-tv-green-deep/60">
              {fmtDate(selected.date)} · {selected.time} · {selected.location}
            </p>

            {/* Info solo soci */}
            {selected.solo_soci && (
              <div className="mt-4 p-3 rounded-2xl bg-tv-sky/40 border border-tv-green-deep/10 text-xs text-tv-green-deep leading-relaxed">
                ℹ️ La partecipazione è riservata ai <b>soci tesserati</b>. Se non lo sei ancora,{" "}
                <a
                  href="#iscrizione"
                  onClick={(e) => { e.preventDefault(); setSelected(null); document.querySelector("#iscrizione")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="underline font-bold hover:text-tv-bordeaux"
                >
                  iscriviti prima qui
                </a>.
              </div>
            )}

            {/* Contributo info */}
            {selected.contributo > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-tv-orange/20 border border-tv-orange/30 text-xs text-tv-green-deep">
                <div className="font-semibold">💶 Contributo: {selected.contributo}€{selected.non_rimborsabile ? " · ⚠️ non rimborsabile" : ""}</div>
                {selected.contributo_note && <div className="mt-1 font-normal italic">{selected.contributo_note}</div>}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <input
                data-testid="event-form-name"
                required
                placeholder="Nome e cognome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
              />
              <input
                data-testid="event-form-email"
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
              />
              <input
                data-testid="event-form-phone"
                placeholder="Telefono (opzionale)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
              />
              <textarea
                data-testid="event-form-message"
                placeholder="Una nota per noi (opzionale)"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
              />
                <input
                 data-testid="detail-form-referral"
                 placeholder="Come hai saputo dell'evento/Chi ti ha consigliato? (opzionale)"
                 value={form.referral || ""}
                 onChange={(e) => setForm({ ...form, referral: e.target.value })}
                 className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
               />
            </div>
            <button
              type="submit"
              disabled={submitting}
              data-testid="event-form-submit"
              className="btn-tv w-full mt-5 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
            >
              {submitting ? "Invio in corso…" : "Invia richiesta"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
};

// ---------- List view ----------
const ListView = ({ events, onParticipate }) => {
  const upcoming = events.filter((e) => !isPast(e.date));
  const past = events.filter((e) => isPast(e.date));
  const featured = upcoming.find((e) => e.featured);
  const others = featured ? upcoming.filter((e) => e.id !== featured.id) : upcoming;
  return (
    <>
      {featured && <FeaturedCard ev={featured} onParticipate={onParticipate} />}
      {others.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {others.map((ev) => (
            <EventCard key={ev.id} ev={ev} onParticipate={onParticipate} />
          ))}
        </div>
      ) : !featured && (
        <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
          Nessun evento in programma al momento. Torna presto!
        </div>
      )}
      {past.length > 0 && (
        <>
          <div className="mt-16 mb-8 flex items-center gap-4">
            <div className="flex-1 border-t border-tv-green-deep/10" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-tv-green-deep/40">📁 Storico eventi</span>
            <div className="flex-1 border-t border-tv-green-deep/10" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {past.map((ev) => (
              <EventCard key={ev.id} ev={ev} onParticipate={onParticipate} past />
            ))}
          </div>
        </>
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
        <div className="flex items-center gap-2"><Clock size={15} /> {ev.time}</div>
        <div className="flex items-center gap-2"><MapPin size={15} /> {ev.location}</div>
        <div className="flex items-center gap-2">
          <Users size={15} />
          {ev.spots <= 0 ? (
            <span className="font-bold opacity-80">🔴 Posti esauriti</span>
          ) : ev.spots <= 5 ? (
            <span className="font-bold text-tv-orange">⚡ Ultimi {ev.spots} posti!</span>
          ) : (
            <>{ev.spots} posti disponibili</>
          )}
        </div>
      </div>
      {ev.contributo > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
          💶 Contributo: {ev.contributo}€
        </div>
      )}
      <div className="mt-7">
        {ev.spots <= 0 ? (
          <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-orange/30 text-tv-green-deep/50 font-bold cursor-not-allowed">
            Tutto esaurito
          </span>
        ) : (
          <Link
            to={`/eventi/${ev.slug || ev.id}`}
            data-testid={`event-featured-detail-${ev.id}`}
            className="btn-tv inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-orange text-tv-green-deep font-bold hover:bg-tv-orange/80"
          >
            Vedi dettagli e Partecipa <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
    <div className="relative md:col-span-5 flex items-center justify-center">
      {ev.has_image ? (
        <img src={`${API}/events/${ev.id}/image`} alt={ev.title} className="w-full max-w-xs rounded-2xl object-cover aspect-square" />
      ) : (
        <span className="text-[10rem] md:text-[12rem] leading-none">{ev.emoji}</span>
      )}
    </div>
  </article>
);

const EventCard = ({ ev, onParticipate, compact = false, past = false }) => (
  <article
    data-testid={`event-card-${ev.id}`}
    className={`group bg-white border border-tv-green-deep/10 rounded-[2rem] overflow-hidden ${
      compact ? "p-5" : "p-6"
    } flex flex-col transition-all duration-500 ${
      past ? "opacity-60" : "hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(5,47,23,0.25)]"
    }`}
  >
    {!compact && ev.has_image && (
      <div className="-mx-6 -mt-6 mb-4">
        <img src={`${API}/events/${ev.id}/image`} alt={ev.title} className="w-full h-44 object-cover" />
      </div>
    )}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            past ? "bg-tv-green-deep/10 text-tv-green-deep/50" : (categoryColor[ev.category] || "bg-tv-sky text-tv-green-deep")
          }`}
        >
          {ev.category}
        </span>
        {past && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tv-green-deep/10 text-tv-green-deep/50">
            Concluso
          </span>
        )}
        {!past && ev.spots <= 0 && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tv-bordeaux text-tv-cream">
            Sold out
          </span>
        )}
      </div>
      <span className="text-3xl">{ev.emoji}</span>
    </div>
    <h3 className="font-display font-black text-xl md:text-2xl text-tv-green-deep leading-tight">
      {ev.title}
    </h3>
    <div className="mt-4 space-y-1.5 text-sm text-tv-green-deep/80">
      <div className="flex items-center gap-2">
        <CalendarIcon size={14} /> {fmtDate(ev.date)}
      </div>
      <div className="flex items-center gap-2">
        <Clock size={14} /> {ev.time}
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={14} /> {ev.location}
      </div>
      {!compact && !past && (
        <div className="flex items-center gap-2">
          <Users size={14} />
          {ev.spots <= 0 ? (
            <span className="text-tv-bordeaux font-bold">Posti esauriti</span>
          ) : ev.spots <= 5 ? (
            <span className="text-orange-500 font-bold">⚡ Ultimi {ev.spots} posti!</span>
          ) : (
            <>{ev.spots} posti disponibili</>
          )}
        </div>
      )}
      {!compact && ev.contributo > 0 && (
        <div className="flex items-center gap-2 font-semibold">
          💶 Contributo: {ev.contributo}€
        </div>
      )}
    </div>
    <div className="mt-auto pt-5">
      {!past && ev.spots <= 0 ? (
        <span className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full font-bold text-sm bg-tv-green-deep/5 border border-tv-green-deep/15 text-tv-green-deep/40 cursor-not-allowed">
          Tutto esaurito
        </span>
      ) : (
        <Link
          to={`/eventi/${ev.slug || ev.id}`}
          data-testid={`event-detail-${ev.id}`}
          className={`inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 ${
            past
              ? "bg-tv-green-deep/5 border border-tv-green-deep/15 text-tv-green-deep hover:bg-tv-green-deep hover:text-tv-cream"
              : "btn-tv bg-tv-green-deep text-tv-cream hover:bg-tv-green"
          }`}
        >
          {past ? "Vedi dettagli" : "Vedi dettagli e Partecipa"}
          {!past && <ArrowRight size={16} />}
        </Link>
      )}
    </div>
  </article>
);

// ---------- Calendar view ----------
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

  // Modifiers for react-day-picker: one per category
  const modifiers = useMemo(() => {
    const m = { hasEvent: eventDates.map((e) => e.date) };
    Object.keys(categoryDot).forEach((cat) => {
      m[`cat-${cat}`] = eventDates.filter((e) => e.category === cat).map((e) => e.date);
    });
    return m;
  }, [eventDates]);

  const renderDay = (day) => {
    const dayEvents = events.filter((e) => sameDay(new Date(e.date), day));
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{day.getDate()}</span>
        {dayEvents.length > 0 && (
          <div className="absolute bottom-0.5 flex gap-0.5">
            {dayEvents.slice(0, 3).map((e, i) => (
              <span
                key={i}
                className="block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: categoryDot[e.category] || "#5CB176" }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-12 gap-6 md:gap-8" data-testid="eventi-calendar">
      <div className="md:col-span-7 lg:col-span-7 bg-white rounded-[2rem] p-4 md:p-8 border border-tv-green-deep/10">
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
          components={{ DayContent: ({ date }) => renderDay(date) }}
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
              "flex-1 text-tv-green-deep/50 font-bold text-[11px] uppercase tracking-wider py-2",
            row: "flex w-full mt-1",
            cell: "flex-1 aspect-square text-center text-sm relative p-0",
            day: "h-full w-full inline-flex items-center justify-center rounded-2xl text-tv-green-deep hover:bg-tv-sky/40 transition-colors aria-selected:opacity-100",
            day_selected:
              "bg-tv-green-deep !text-tv-cream font-bold hover:bg-tv-green-deep hover:!text-tv-cream",
            day_today: "bg-tv-green-deep/10 font-bold",
            day_outside: "text-tv-green-deep/25",
            day_disabled: "text-tv-green-deep/25 opacity-50",
            day_hidden: "invisible",
          }}
        />
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3 justify-center">
          {Object.entries(categoryDot).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-tv-green-deep/70">
              <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-5 lg:col-span-5">
        {!pickedDate ? (
          <div
            className="rounded-[2rem] p-8 bg-tv-sky/30 border border-tv-green-deep/10 text-tv-green-deep"
            data-testid="calendar-no-selection"
          >
            <CalendarDays size={28} className="mb-3" />
            <div className="font-display font-black text-2xl leading-tight">
              Scegli un giorno.
            </div>
            <div className="mt-2 text-sm text-tv-green-deep/70">
              Tocca una data sul calendario per vedere cosa succede quel giorno.
              I puntini sotto i numeri segnalano gli eventi in programma.
            </div>
          </div>
        ) : eventsForPicked.length === 0 ? (
          <div
            className="rounded-[2rem] p-8 bg-white border border-tv-green-deep/10 text-tv-green-deep"
            data-testid="calendar-no-events"
          >
            <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux mb-2">
              {pickedDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div className="font-display font-black text-2xl leading-tight">
              Niente eventi questo giorno.
            </div>
            <div className="mt-2 text-sm text-tv-green-deep/60">
              Ma se hai un'idea, proponicela: la prossima trama la tessiamo insieme.
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="calendar-events-list">
            <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
              {pickedDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            {eventsForPicked.map((ev) => (
              <EventCard key={ev.id} ev={ev} onParticipate={onParticipate} compact past={isPast(ev.date)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Eventi;
