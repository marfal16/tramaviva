import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { LogOut, Trash2, Mail, Users, Calendar, MessageSquare, Lock, ArrowLeft, Plus, Pencil, X, CalendarPlus } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = "tv_admin_token";

const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const Login = ({ onLogin }) => {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/login`, { token: pwd });
      localStorage.setItem(TOKEN_KEY, pwd);
      toast.success("Benvenut*!");
      onLogin(pwd);
    } catch (err) {
      toast.error("Password non valida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tv-cream flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="w-full max-w-md bg-white rounded-[2rem] p-8 md:p-10 border border-tv-green-deep/10"
      >
        <div className="flex justify-center mb-6">
          <Logo variant="inline" size={52} />
        </div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
            <Lock size={14} /> Area riservata
          </div>
          <h1 className="mt-3 font-display font-black text-3xl text-tv-green-deep">
            Dashboard amministratore
          </h1>
        </div>
        <label className="block">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
            Password
          </div>
          <input
            data-testid="admin-password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          data-testid="admin-login-submit"
          className="btn-tv w-full mt-5 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
        >
          {loading ? "Accesso…" : "Accedi"}
        </button>
        <a
          href="/"
          className="mt-5 flex items-center justify-center gap-2 text-sm text-tv-green-deep/60 hover:text-tv-green-deep"
          data-testid="admin-back-home"
        >
          <ArrowLeft size={14} /> Torna al sito
        </a>
      </form>
    </div>
  );
};

const TABS = [
  { key: "events", label: "Eventi", icon: CalendarPlus },
  { key: "memberships", label: "Iscrizioni soci", icon: Users },
  { key: "event-signups", label: "Richieste eventi", icon: Calendar },
  { key: "contacts", label: "Messaggi contatti", icon: MessageSquare },
];

const CATEGORIES = ["Aperitivi Sociali", "Passeggiate", "Screening Salute", "Corsi IT"];

const Dashboard = ({ token, onLogout }) => {
  const [tab, setTab] = useState("events");
  const [data, setData] = useState({ memberships: [], "event-signups": [], contacts: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [eventEditor, setEventEditor] = useState(null);

  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, es, c, ev] = await Promise.all([
        axios.get(`${API}/admin/memberships`, authHeader),
        axios.get(`${API}/admin/event-signups`, authHeader),
        axios.get(`${API}/admin/contacts`, authHeader),
        axios.get(`${API}/admin/events`, authHeader),
      ]);
      setData({ memberships: m.data, "event-signups": es.data, contacts: c.data, events: ev.data });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Sessione scaduta, rifai login.");
        onLogout();
      } else {
        toast.error("Errore nel caricamento.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  const remove = async (collection, id) => {
    if (!window.confirm("Sei sicuro di voler eliminare?")) return;
    try {
      await axios.delete(`${API}/admin/${collection}/${id}`, authHeader);
      toast.success("Eliminato.");
      setData({ ...data, [collection]: data[collection].filter((d) => d.id !== id) });
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const exportCsv = () => {
    const rows = data[tab];
    if (!rows.length) return toast.error("Nessun dato da esportare.");
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tramaviva-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const list = data[tab] || [];

  return (
    <div className="min-h-screen bg-tv-cream">
      <header className="sticky top-0 z-40 bg-tv-cream/90 backdrop-blur-xl border-b border-tv-green-deep/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3" data-testid="admin-home-link">
            <Logo variant="inline" size={38} />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              data-testid="admin-export-csv"
              className="btn-tv hidden sm:inline-flex px-4 py-2 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm"
            >
              Esporta CSV
            </button>
            <button
              onClick={onLogout}
              data-testid="admin-logout"
              className="btn-tv inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm"
            >
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display font-black text-4xl md:text-5xl text-tv-green-deep mb-1">
          Dashboard
        </h1>
        <p className="text-tv-green-deep/70 mb-8">
          Tutte le richieste e i messaggi dell'associazione.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`admin-tab-${t.key}`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                tab === t.key
                  ? "bg-tv-green-deep text-tv-cream"
                  : "bg-white text-tv-green-deep/70 hover:bg-tv-mint/30 border border-tv-green-deep/10"
              }`}
            >
              <t.icon size={16} />
              {t.label}
              <span className="opacity-70">({data[t.key]?.length ?? 0})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-tv-green-deep/60" data-testid="admin-loading">Caricamento…</div>
        ) : tab === "events" ? (
          <EventsManager
            events={data.events}
            onCreate={() => setEventEditor("new")}
            onEdit={(ev) => setEventEditor(ev)}
            onDelete={(id) => remove("events", id)}
          />
        ) : list.length === 0 ? (
          <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60" data-testid="admin-empty">
            Ancora niente qui. Quando qualcuno invierà un modulo, lo vedrai apparire.
          </div>
        ) : (
          <div className="grid gap-4" data-testid="admin-list">
            {list.map((row) => (
              <article
                key={row.id}
                className="bg-white rounded-3xl p-5 md:p-6 border border-tv-green-deep/10 flex flex-col md:flex-row md:items-center gap-4 justify-between"
                data-testid={`admin-row-${row.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display font-black text-lg text-tv-green-deep">
                      {row.first_name
                        ? `${row.first_name} ${row.last_name || ""}`
                        : row.name || row.event_title}
                    </span>
                    {row.event_title && (
                      <span className="text-xs font-bold uppercase tracking-wider bg-tv-orange/30 text-tv-green-deep px-2.5 py-1 rounded-full">
                        {row.event_title}
                      </span>
                    )}
                    <span className="text-xs text-tv-green-deep/50">{fmtDate(row.created_at)}</span>
                  </div>
                  <div className="mt-2 text-sm text-tv-green-deep/80 flex flex-wrap gap-x-4 gap-y-1">
                    {row.email && (
                      <a href={`mailto:${row.email}`} className="inline-flex items-center gap-1 hover:text-tv-bordeaux">
                        <Mail size={13} /> {row.email}
                      </a>
                    )}
                    {row.phone && <span>📞 {row.phone}</span>}
                    {row.city && <span>📍 {row.city}</span>}
                  </div>
                  {(row.motivation || row.message) && (
                    <p className="mt-3 text-sm text-tv-green-deep/70 italic">
                      "{row.motivation || row.message}"
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(tab, row.id)}
                  data-testid={`admin-delete-${row.id}`}
                  className="self-start md:self-center p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
                  aria-label="Elimina"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      {eventEditor && (
        <EventEditor
          token={token}
          initial={eventEditor === "new" ? null : eventEditor}
          onClose={() => setEventEditor(null)}
          onSaved={() => { setEventEditor(null); loadAll(); }}
        />
      )}
    </div>
  );
};

// ---------- Events Manager ----------
const EventsManager = ({ events, onCreate, onEdit, onDelete }) => {
  const fmtDay = (d) => {
    try { return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };
  return (
    <div data-testid="admin-events-manager">
      <button
        onClick={onCreate}
        data-testid="admin-event-new"
        className="btn-tv inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold mb-6"
      >
        <Plus size={18} /> Crea nuovo evento
      </button>
      {events.length === 0 ? (
        <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
          Nessun evento ancora. Crea il primo!
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((ev) => (
            <article
              key={ev.id}
              data-testid={`admin-event-row-${ev.id}`}
              className="bg-white rounded-3xl p-5 md:p-6 border border-tv-green-deep/10 flex flex-col md:flex-row md:items-center gap-4 justify-between"
            >
              <div className="flex items-start gap-4 flex-1">
                <span className="text-3xl">{ev.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider bg-tv-mint/40 text-tv-green-deep px-2.5 py-1 rounded-full">
                      {ev.category}
                    </span>
                    <span className="text-xs text-tv-green-deep/60">
                      {fmtDay(ev.date)} · {ev.time}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display font-black text-lg text-tv-green-deep flex items-center gap-2">
                    {ev.title}
                    {ev.featured && (
                      <span className="text-xs font-bold uppercase tracking-wider bg-tv-orange text-tv-green-deep px-2 py-0.5 rounded-full">
                        ⭐ In evidenza
                      </span>
                    )}
                  </h3>
                  <div className="text-sm text-tv-green-deep/70">📍 {ev.location} · 👥 {ev.spots} posti</div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => onEdit(ev)}
                  data-testid={`admin-event-edit-${ev.id}`}
                  className="p-2.5 rounded-full bg-tv-mint/30 text-tv-green-deep hover:bg-tv-mint transition-colors"
                  aria-label="Modifica"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onDelete(ev.id)}
                  data-testid={`admin-event-delete-${ev.id}`}
                  className="p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
                  aria-label="Elimina"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Event Editor (create / edit) ----------
const EMOJI_CHOICES = ["🍹", "🌿", "💚", "💻", "🎬", "🎨", "🎉", "🧘", "🥾", "🎤", "📚", "🍕", "✨"];

const EventEditor = ({ token, initial, onClose, onSaved }) => {
  const isNew = !initial;
  const [form, setForm] = useState(
    initial || {
      title: "",
      category: CATEGORIES[0],
      date: "",
      time: "19:00",
      location: "",
      description: "",
      emoji: "✨",
      spots: 20,
      featured: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.date || !form.time || !form.location || !form.description) {
      toast.error("Compila tutti i campi obbligatori.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, spots: Number(form.spots) || 20 };
      const headers = { Authorization: `Bearer ${token}` };
      if (isNew) {
        await axios.post(`${API}/admin/events`, payload, { headers });
        toast.success("Evento creato!");
      } else {
        await axios.put(`${API}/admin/events/${initial.id}`, payload, { headers });
        toast.success("Evento aggiornato!");
      }
      onSaved();
    } catch (err) {
      toast.error("Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-tv-green-deep/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      data-testid="admin-event-editor"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-2xl bg-tv-cream rounded-[2rem] p-7 md:p-9 my-8 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-tv-green-deep text-tv-cream hover:bg-tv-green"
          data-testid="admin-event-editor-close"
          aria-label="Chiudi"
        >
          <X size={16} />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
          {isNew ? "Nuovo evento" : "Modifica evento"}
        </div>
        <h3 className="mt-1 font-display font-black text-2xl md:text-3xl text-tv-green-deep">
          {isNew ? "Crea evento" : form.title}
        </h3>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Titolo *" value={form.title} onChange={change("title")} required testid="event-title" />
          <label className="block">
            <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
              Categoria *
            </div>
            <select
              data-testid="event-category"
              value={form.category}
              onChange={change("category")}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <Field label="Data *" type="date" value={form.date} onChange={change("date")} required testid="event-date" />
          <Field label="Ora *" type="time" value={form.time} onChange={change("time")} required testid="event-time" />
          <Field label="Luogo *" value={form.location} onChange={change("location")} required testid="event-location" />
          <Field label="Posti" type="number" value={form.spots} onChange={change("spots")} testid="event-spots" />
        </div>

        <label className="block mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
            Descrizione *
          </div>
          <textarea
            data-testid="event-description"
            rows={4}
            value={form.description}
            onChange={change("description")}
            placeholder="Cosa succede in questo evento? Sii ironic*, fresc*, vivac*."
            className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
          />
        </label>

        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">
            Emoji
          </div>
          <div className="flex flex-wrap gap-2" data-testid="event-emoji-picker">
            {EMOJI_CHOICES.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setForm({ ...form, emoji: em })}
                data-testid={`event-emoji-${em}`}
                className={`w-11 h-11 rounded-2xl text-xl transition-all ${
                  form.emoji === em
                    ? "bg-tv-green-deep ring-2 ring-tv-green-deep scale-110"
                    : "bg-white border border-tv-green-deep/15 hover:bg-tv-mint/30"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-tv-orange/15 border border-tv-orange/30">
          <input
            type="checkbox"
            data-testid="event-featured"
            checked={!!form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            className="w-5 h-5 accent-tv-green-deep"
          />
          <div className="flex-1">
            <div className="font-bold text-tv-green-deep text-sm">⭐ Metti in evidenza</div>
            <div className="text-xs text-tv-green-deep/70">
              Diventa l'evento principale in homepage. Solo uno alla volta consigliato.
            </div>
          </div>
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            data-testid="event-save"
            className="btn-tv flex-1 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
          >
            {saving ? "Salvo…" : isNew ? "Crea evento" : "Salva modifiche"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-4 rounded-full bg-white border border-tv-green-deep/15 text-tv-green-deep font-bold"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, type = "text", value, onChange, required, testid }) => (
  <label className="block">
    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
      {label}
    </div>
    <input
      data-testid={testid}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      required={required}
      className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
    />
  </label>
);

export const Admin = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
  };

  if (!token) return <Login onLogin={setToken} />;
  return <Dashboard token={token} onLogout={logout} />;
};

export default Admin;
