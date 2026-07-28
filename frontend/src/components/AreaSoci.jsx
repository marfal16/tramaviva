import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  LogOut, Camera, Edit2, Check, X, Calendar, ChevronRight,
  Loader2, Lock, Star, BookOpen, MessageSquare, ThumbsUp, Award
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtDate = d => {
  try { return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return d || "—"; }
};

const fmtMonth = m => {
  if (!m) return "—";
  try {
    const [y, mo] = m.split("-");
    return new Date(y, parseInt(mo) - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  } catch { return m; }
};

// ─── Avatar ──────────────────────────────────────────────────────────────────

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
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("socio_token")}` },
          body: JSON.stringify({ image_data: ev.target.result }),
        });
        if (!r.ok) throw new Error();
        onUpload();
        toast.success("Foto profilo aggiornata!");
      } catch { toast.error("Errore nel caricamento"); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {user.has_avatar ? (
        <img src={`${API}/api/users/${user.id}/avatar?t=${Date.now()}`} alt={user.name}
          className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" />
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

// ─── Editable field ───────────────────────────────────────────────────────────

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

// ─── Change password ──────────────────────────────────────────────────────────

const ChangePasswordForm = ({ token }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.next !== form.confirm) { toast.error("Le nuove password non coincidono."); return; }
    if (form.next.length < 8) { toast.error("Min. 8 caratteri."); return; }
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
    <div className="border-t border-tv-green-deep/10 pt-4">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-bold text-tv-green-deep/60 hover:text-tv-green-deep transition-colors">
        <Lock size={14} /> Cambia password
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          {[["Password attuale", "current"], ["Nuova password", "next"], ["Conferma", "confirm"]].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">{label}</label>
              <input type="password" value={form[key]} onChange={set(key)} required
                className="w-full px-3 py-2.5 rounded-2xl border border-tv-green-deep/15 bg-tv-cream/40 focus:border-tv-green focus:outline-none text-sm text-tv-green-deep" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full px-5 py-2.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Salvo…</> : "Salva password"}
          </button>
        </form>
      )}
    </div>
  );
};

// ─── Stars rating ─────────────────────────────────────────────────────────────

const Stars = ({ rating }) => (
  <span className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={11} className={i <= rating ? "text-tv-orange fill-tv-orange" : "text-tv-green-deep/20"} />
    ))}
  </span>
);

// ─── Area Soci ────────────────────────────────────────────────────────────────

export const AreaSoci = () => {
  const { user, token, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("eventi");

  const [eventsData, setEventsData] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [votes, setVotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/api/auth/me/member-info`, { headers: h }).then(r => r.ok ? r.json() : {}).then(setMemberInfo);
    fetch(`${API}/api/auth/me/events`, { headers: h }).then(r => r.ok ? r.json() : null).then(setEventsData);
    fetch(`${API}/api/books`).then(r => r.ok ? r.json() : []).then(data => setBooks((data || []).filter(b => b.status === "concluso")));
  }, [token, navigate]);

  useEffect(() => {
    if (tab === "club" && reviews.length === 0 && votes.length === 0) {
      setLoadingTab(true);
      const h = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`${API}/api/auth/me/reviews`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/auth/me/votes`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]).then(([rev, vot]) => { setReviews(rev); setVotes(vot); setLoadingTab(false); });
    }
  }, [tab, token]);

  const refreshUser = () => {
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(u => u && setUser(u));
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

  if (!user) return null;

  const isFondatore = memberInfo?.is_fondatore || !memberInfo?.tessera_number;

  const tabs = [
    { key: "eventi", label: "I miei eventi", icon: Calendar },
    { key: "club", label: "Club del Libro", icon: BookOpen },
    { key: "profilo", label: "Profilo", icon: Edit2 },
  ];

  return (
    <div className="App bg-tv-cream min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-tv-green-deep rounded-[2rem] p-7 md:p-10 text-tv-cream mb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-tv-green/30 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar user={user} onUpload={refreshUser} size={88} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-black uppercase tracking-[.2em] text-tv-cream/40">Area soci</span>
                {isFondatore && memberInfo !== null && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award size={9} /> Socio fondatore
                  </span>
                )}
              </div>
              <h1 className="font-display font-black text-3xl md:text-4xl leading-tight">{user.name}</h1>
              <p className="text-sm text-tv-cream/60 mt-1">{user.email}</p>
              {memberInfo?.tessera_number && (
                <p className="text-xs text-tv-cream/40 mt-1">🎫 Tessera #{memberInfo.tessera_number}</p>
              )}
            </div>
            <button onClick={() => { logout(); navigate("/"); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-tv-cream/20 text-tv-cream/60 hover:text-tv-cream hover:border-tv-cream/50 text-sm font-semibold transition-all shrink-0">
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-tv-green-deep/8 mb-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === key ? "bg-tv-green-deep text-tv-cream shadow-sm" : "text-tv-green-deep/60 hover:text-tv-green-deep hover:bg-tv-mint/30"}`}>
              <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: eventi ── */}
        {tab === "eventi" && (
          <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="font-display font-black text-lg text-tv-green-deep">I miei eventi</h2>
              {isFondatore && memberInfo !== null && (
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-800 px-2 py-0.5 rounded-full">
                  Fondatore — tutti gli eventi
                </span>
              )}
            </div>
            {!eventsData ? (
              <div className="flex items-center justify-center py-10 text-tv-green-deep/30"><Loader2 size={24} className="animate-spin" /></div>
            ) : eventsData.is_fondatore ? (
              eventsData.events.length === 0 ? (
                <p className="text-sm text-tv-green-deep/40 text-center py-8">Nessun evento trovato.</p>
              ) : (
                <div className="flex flex-col divide-y divide-tv-green-deep/8">
                  {eventsData.events.map(ev => (
                    <Link key={ev.id} to={`/eventi/${ev.slug || ev.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-tv-mint/20 -mx-2 px-2 rounded-xl transition-colors">
                      <span className="text-xl shrink-0">{ev.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-tv-green-deep truncate">{ev.title}</p>
                        <p className="text-xs text-tv-green-deep/40">{fmtDate(ev.date)} · {ev.location}</p>
                      </div>
                      <ChevronRight size={14} className="text-tv-green-deep/25 shrink-0" />
                    </Link>
                  ))}
                </div>
              )
            ) : eventsData.signups.length === 0 ? (
              <div className="text-center py-10 text-tv-green-deep/40">
                <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Non hai ancora partecipato a nessun evento.</p>
                <Link to="/#eventi" className="mt-3 inline-block text-sm font-bold text-tv-green-deep/60 hover:text-tv-green-deep transition-colors">Scopri gli eventi →</Link>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-tv-green-deep/8">
                {eventsData.signups.map(ev => (
                  <div key={ev.id} className="flex items-center gap-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-tv-green-deep truncate">{ev.event_title}</p>
                      <p className="text-xs text-tv-green-deep/40 mt-0.5">Iscrizione: {fmtDate(ev.created_at)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ev.confirmed ? "bg-tv-green/15 text-tv-green-deep" : "bg-tv-orange/15 text-tv-orange"}`}>
                      {ev.confirmed ? "Confermato" : "In attesa"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: club del libro ── */}
        {tab === "club" && (
          <div className="flex flex-col gap-6">

            {/* Libri letti */}
            <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
              <h2 className="font-display font-black text-lg text-tv-green-deep mb-4">Libri letti insieme</h2>
              {books.length === 0 ? (
                <p className="text-sm text-tv-green-deep/40 text-center py-6">Nessun libro concluso ancora.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {books.map(b => (
                    <Link key={b.id} to={`/club-del-libro/${b.id}`}
                      className="group flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-tv-mint/30 transition-colors">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt={b.title} className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm" />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-tv-green-deep/10 rounded-xl flex items-center justify-center">
                          <BookOpen size={24} className="text-tv-green-deep/30" />
                        </div>
                      )}
                      <p className="text-xs font-bold text-tv-green-deep leading-tight group-hover:text-tv-green transition-colors line-clamp-2">{b.title}</p>
                      <p className="text-[10px] text-tv-green-deep/45 truncate">{b.author}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {loadingTab ? (
              <div className="flex items-center justify-center py-10 text-tv-green-deep/30"><Loader2 size={24} className="animate-spin" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">

                {/* Le mie recensioni */}
                <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={16} className="text-tv-green-deep/50" />
                    <h2 className="font-display font-black text-lg text-tv-green-deep">Le mie recensioni</h2>
                  </div>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-6">Nessuna recensione ancora.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-tv-green-deep/8">
                      {reviews.map(r => (
                        <div key={r.id} className="py-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-tv-green-deep leading-tight">{r.book_title || "—"}</p>
                            <Stars rating={r.rating} />
                          </div>
                          {r.content && <p className="text-xs text-tv-green-deep/60 mt-1 line-clamp-2">{r.content}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* I miei voti */}
                <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsUp size={16} className="text-tv-green-deep/50" />
                    <h2 className="font-display font-black text-lg text-tv-green-deep">Proposte votate</h2>
                  </div>
                  {votes.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-6">Nessun voto registrato.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-tv-green-deep/8">
                      {votes.map(p => (
                        <div key={p.id} className="py-3.5 flex items-start gap-3">
                          {p.cover_url ? (
                            <img src={p.cover_url} alt={p.title} className="w-9 h-12 object-cover rounded-lg shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-9 h-12 bg-tv-green-deep/10 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen size={14} className="text-tv-green-deep/30" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-tv-green-deep leading-tight truncate">{p.title}</p>
                            {p.author && <p className="text-xs text-tv-green-deep/50 truncate">{p.author}</p>}
                            <p className="text-[10px] text-tv-green-deep/35 mt-0.5">{fmtMonth(p.proposed_month)} · {p.votes} voti totali</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Tab: profilo ── */}
        {tab === "profilo" && (
          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6 flex flex-col gap-5">
              <h2 className="font-display font-black text-lg text-tv-green-deep">Profilo</h2>
              <EditableField label="Nome visualizzato" value={user.name} onSave={saveField("name")} />
              <EditableField label="Bio" value={user.bio} onSave={saveField("bio")} multiline />
              <ChangePasswordForm token={token} />
            </div>

            {memberInfo && (
              <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6 flex flex-col gap-4">
                <h2 className="font-display font-black text-lg text-tv-green-deep">Info socio</h2>
                <div className="space-y-3 text-sm">
                  {memberInfo.tessera_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-tv-green-deep/50">N° tessera</span>
                      <span className="font-bold text-tv-green-deep">#{memberInfo.tessera_number}</span>
                    </div>
                  )}
                  {isFondatore && (
                    <div className="flex justify-between items-center">
                      <span className="text-tv-green-deep/50">Ruolo</span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Award size={9} /> Socio fondatore
                      </span>
                    </div>
                  )}
                  {memberInfo.joined_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-tv-green-deep/50">Socio dal</span>
                      <span className="font-semibold text-tv-green-deep">{fmtDate(memberInfo.joined_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-tv-green-deep/50">Email account</span>
                    <span className="text-tv-green-deep/70 text-xs">{user.email}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default AreaSoci;
