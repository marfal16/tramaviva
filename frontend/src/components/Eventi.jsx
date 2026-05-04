import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, MapPin, Clock, Users, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
};

const categoryColor = {
  "Aperitivi Sociali": "bg-tv-orange text-tv-green-deep",
  "Passeggiate": "bg-tv-mint text-tv-green-deep",
  "Screening Salute": "bg-tv-bordeaux text-tv-cream",
  "Corsi IT": "bg-tv-sky text-tv-cream",
};

export const Eventi = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

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
              ③ Prossimi eventi
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
              Ci sei o ti<br />
              <span className="italic font-light text-tv-bordeaux">racconto dopo</span> com'è andata?
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {events.map((ev, i) => (
              <article
                key={ev.id}
                data-testid={`event-card-${ev.id}`}
                className="group bg-white border border-tv-green-deep/10 rounded-[2rem] p-6 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(5,47,23,0.25)]"
              >
                <div className="flex items-center justify-between mb-5">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      categoryColor[ev.category] || "bg-tv-mint text-tv-green-deep"
                    }`}
                  >
                    {ev.category}
                  </span>
                  <span className="text-3xl">{ev.emoji}</span>
                </div>
                <h3 className="font-display font-black text-2xl text-tv-green-deep leading-tight">
                  {ev.title}
                </h3>
                <p className="mt-3 text-sm text-tv-green-deep/70 leading-snug flex-1">
                  {ev.description}
                </p>
                <div className="mt-5 space-y-2 text-sm text-tv-green-deep/80">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} /> {fmtDate(ev.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} /> {ev.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={15} /> {ev.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} /> {ev.spots} posti disponibili
                  </div>
                </div>
                <button
                  onClick={() => setSelected(ev)}
                  data-testid={`event-participate-${ev.id}`}
                  className="btn-tv mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green"
                >
                  Partecipa
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Participation modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] bg-tv-green-deep/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          data-testid="event-modal"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-lg bg-tv-cream rounded-[2rem] p-7 md:p-9 relative"
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

export default Eventi;
