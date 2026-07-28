import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { LogOut, Camera, Edit2, Check, X, Calendar, ChevronRight, Loader2, Lock } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtDate = d => {
  try { return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d; }
};

const Avatar = ({ user, onUpload, size = 96 }) => {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Seleziona un'immagine"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const r = await fetch(`${API}/api/auth/me/avatar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("socio_token")}`,
          },
          body: JSON.stringify({ image_data: ev.target.result }),
        });
        if (!r.ok) throw new Error();
        onUpload();
        toast.success("Foto profilo aggiornata!");
      } catch {
        toast.error("Errore nel caricamento");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {user.has_avatar ? (
        <img
          src={`${API}/api/users/${user.id}/avatar?t=${Date.now()}`}
          alt={user.name}
          className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-tv-green-deep flex items-center justify-center text-tv-cream font-black text-3xl shadow-lg border-4 border-white">
          {user.name?.charAt(0)?.toUpperCase() || "S"}
        </div>
      )}
      <button onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-tv-orange text-tv-green-deep flex items-center justify-center shadow-md hover:bg-tv-orange/80 transition-colors">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

const EditableField = ({ label, value, onSave, multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50">{label}</span>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-tv-green-deep/40 hover:text-tv-green-deep transition-colors">
            <Edit2 size={13} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2 items-start">
          {multiline ? (
            <textarea value={val} onChange={e => setVal(e.target.value)} rows={3}
              className="flex-1 px-3 py-2 rounded-2xl border border-tv-green-deep/20 bg-tv-cream/40 focus:border-tv-green focus:outline-none text-sm text-tv-green-deep resize-none" />
          ) : (
            <input value={val} onChange={e => setVal(e.target.value)}
              className="flex-1 px-3 py-2 rounded-2xl border border-tv-green-deep/20 bg-tv-cream/40 focus:border-tv-green focus:outline-none text-sm text-tv-green-deep" />
          )}
          <button onClick={handleSave} disabled={saving}
            className="p-2 rounded-xl bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          </button>
          <button onClick={() => { setVal(value || ""); setEditing(false); }}
            className="p-2 rounded-xl bg-tv-green-deep/10 text-tv-green-deep hover:bg-tv-green-deep/20 transition-colors">
            <X size={13} />
          </button>
        </div>
      ) : (
        <p className="text-sm text-tv-green-deep/70">{value || <span className="italic text-tv-green-deep/30">Non specificato</span>}</p>
      )}
    </div>
  );
};

const ChangePasswordForm = ({ token }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.next !== form.confirm) { toast.error("Le nuove password non coincidono."); return; }
    if (form.next.length < 8) { toast.error("La password deve essere di almeno 8 caratteri."); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/me/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || "Errore"); return; }
      toast.success("Password aggiornata!");
      setForm({ current: "", next: "", confirm: "" });
      setOpen(false);
    } catch { toast.error("Errore di connessione"); }
    finally { setLoading(false); }
  };

  return (
    <div className="border-t border-tv-green-deep/10 pt-5">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-bold text-tv-green-deep/60 hover:text-tv-green-deep transition-colors">
        <Lock size={14} /> Cambia password
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {[["Password attuale", "current"], ["Nuova password", "next"], ["Conferma nuova password", "confirm"]].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">{label}</label>
              <input type="password" value={form[key]} onChange={set(key)} required
                className="w-full px-3 py-2.5 rounded-2xl border border-tv-green-deep/15 bg-tv-cream/40 focus:border-tv-green focus:outline-none text-sm text-tv-green-deep" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full px-5 py-2.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Salvataggio…</> : "Salva nuova password"}
          </button>
        </form>
      )}
    </div>
  );
};

export const AreaSoci = () => {
  const { user, token, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/api/auth/me/events`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(data); setLoadingEvents(false); })
      .catch(() => setLoadingEvents(false));
  }, [token, navigate]);

  const refreshUser = () => {
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => u && setUser(u));
  };

  const saveField = field => async value => {
    const r = await fetch(`${API}/api/auth/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    });
    if (r.ok) { const u = await r.json(); setUser(u); toast.success("Salvato!"); }
    else toast.error("Errore nel salvataggio");
  };

  const handleLogout = () => { logout(); navigate("/"); };

  if (!user) return null;

  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-5xl mx-auto">

        {/* Header profilo */}
        <div className="bg-tv-green-deep rounded-[2rem] p-7 md:p-10 text-tv-cream mb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-tv-green/30 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar user={user} onUpload={refreshUser} size={88} />
            <div className="flex-1">
              <div className="text-xs font-black uppercase tracking-[.2em] text-tv-cream/40 mb-1">Area soci</div>
              <h1 className="font-display font-black text-3xl md:text-4xl leading-tight">{user.name}</h1>
              <p className="text-sm text-tv-cream/60 mt-1">{user.email}</p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-tv-cream/20 text-tv-cream/60 hover:text-tv-cream hover:border-tv-cream/50 text-sm font-semibold transition-all">
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Profilo */}
          <div className="md:col-span-1 bg-white rounded-[2rem] border border-tv-green-deep/8 p-6 flex flex-col gap-5">
            <h2 className="font-display font-black text-lg text-tv-green-deep">Profilo</h2>
            <EditableField label="Nome" value={user.name} onSave={saveField("name")} />
            <EditableField label="Bio" value={user.bio} onSave={saveField("bio")} multiline />
            <ChangePasswordForm token={token} />
          </div>

          {/* Storico eventi */}
          <div className="md:col-span-2 bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
            <h2 className="font-display font-black text-lg text-tv-green-deep mb-5">I miei eventi</h2>
            {loadingEvents ? (
              <div className="flex items-center justify-center py-10 text-tv-green-deep/30">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-10 text-tv-green-deep/40">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Non hai ancora partecipato a nessun evento.</p>
                <Link to="/eventi" className="mt-3 inline-block text-sm font-bold text-tv-green-deep/60 hover:text-tv-green-deep transition-colors">
                  Scopri gli eventi →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-tv-green-deep/8">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-center gap-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-tv-green-deep truncate">{ev.event_title}</p>
                      <p className="text-xs text-tv-green-deep/40 mt-0.5">{fmtDate(ev.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.confirmed ? "bg-tv-green/15 text-tv-green-deep" : "bg-tv-orange/15 text-tv-orange"}`}>
                        {ev.confirmed ? "Confermato" : "In attesa"}
                      </span>
                      <ChevronRight size={14} className="text-tv-green-deep/25" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AreaSoci;
