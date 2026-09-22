import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  LogOut, Camera, Edit2, Check, X, Calendar, ChevronRight,
  Loader2, Lock, Star, BookOpen, Film, MessageSquare, ThumbsUp, Award,
  Heart, Send, Trash2, ImagePlus, Users, Trophy, Gift, Plus
} from "lucide-react";
import Navbar from "./Navbar";
import CoverSearchWidget from "./CoverSearchWidget";
import Footer from "./Footer";
import { CLUBS_CONFIG } from "../clubsConfig";

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
        <img src={user.avatar_url || `${API}/api/users/${user.id}/avatar?t=${Date.now()}`} alt={user.name}
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

// ─── Missioni: card layout ────────────────────────────────────────────────────

const MissioniCards = ({ missionsData }) => {
  if (!missionsData) return (
    <div className="flex items-center justify-center py-16 text-tv-green-deep/30">
      <Loader2 size={24} className="animate-spin" />
    </div>
  );

  const missions = missionsData.missions || [];
  const unlocked = missions.filter(m => m.unlocked).length;
  const total = missions.length;
  const eventCount = missionsData.event_count || 0;
  const pctOverall = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">

      {/* Summary header */}
      <div className="bg-tv-green-deep rounded-[2rem] p-6 md:p-8 relative overflow-hidden text-tv-cream">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-tv-green/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-xs font-black uppercase tracking-widest text-tv-cream/40 mb-3">Le tue missioni</div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10 mb-5">
            <div>
              <div className="font-display font-black text-4xl md:text-5xl text-tv-cream leading-none">
                {unlocked}<span className="text-tv-cream/30 text-2xl"> / {total}</span>
              </div>
              <p className="text-sm text-tv-cream/55 mt-1">
                {eventCount === 0
                  ? "Partecipa agli eventi per sbloccare le missioni."
                  : `${eventCount} event${eventCount === 1 ? "o" : "i"} frequentat${eventCount === 1 ? "o" : "i"}.`}
              </p>
            </div>
            {missionsData.is_fondatore && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                <Award size={9} /> Socio fondatore
              </span>
            )}
          </div>
          {total > 0 && (
            <div>
              <div className="flex justify-between mb-1.5 text-[10px] font-bold uppercase tracking-wider text-tv-cream/30">
                <span>Avanzamento</span>
                <span>{pctOverall}%</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-tv-green to-tv-sky transition-all duration-700"
                  style={{ width: `${pctOverall}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mission cards */}
      {total === 0 ? (
        <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-12 text-center">
          <Trophy size={36} className="mx-auto mb-3 text-tv-green-deep/15" />
          <p className="text-sm text-tv-green-deep/40">Le missioni saranno presto disponibili.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {missions.map((m) => {
            const pct = m.required_events > 0 ? Math.min(100, (m.current_count / m.required_events) * 100) : 0;
            const remaining = m.required_events - m.current_count;
            return (
              <div
                key={m.id}
                className={`rounded-[1.75rem] border p-5 flex flex-col gap-4 transition-all ${
                  m.unlocked
                    ? "bg-white border-tv-green/25 shadow-[0_4px_24px_-8px_rgba(167,185,76,0.2)]"
                    : "bg-white/70 border-tv-green-deep/8"
                }`}
              >
                {/* Icon + title */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-all ${
                    m.unlocked ? "bg-tv-green/15" : "bg-tv-green-deep/5 grayscale opacity-40"
                  }`}>
                    {m.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`font-display font-black text-base leading-tight ${m.unlocked ? "text-tv-green-deep" : "text-tv-green-deep/30"}`}>
                        {m.title}
                      </h3>
                      {m.unlocked && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                          <Check size={8} /> Completata
                        </span>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${m.unlocked ? "text-tv-green-deep/55" : "text-tv-green-deep/25"}`}>
                      {m.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar (locked only) */}
                {!m.unlocked && (
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/25">
                        {m.event_id ? "Evento speciale" : "Progressi"}
                      </span>
                      <span className="text-[10px] font-bold text-tv-green-deep/25">
                        {m.event_id ? "🔒" : `${m.current_count} / ${m.required_events}`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-tv-green-deep/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-tv-green/40 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-tv-green-deep/20 font-medium">
                      {m.event_id
                        ? `Partecipa a "${m.event_title || "questo evento speciale"}" per sbloccare`
                        : remaining > 0
                          ? `Ancora ${remaining} event${remaining === 1 ? "o" : "i"}${m.category ? ` "${m.category}"` : ""} per sbloccare`
                          : "Presto sbloccata!"}
                    </p>
                  </div>
                )}

                {/* Footer: reward + status */}
                <div className={`flex items-center justify-between pt-3 border-t ${m.unlocked ? "border-tv-green/15" : "border-tv-green-deep/5"}`}>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${m.unlocked ? "text-tv-green-deep/60" : "text-tv-green-deep/20"}`}>
                    <Gift size={12} /> {m.reward}
                  </div>
                  {m.unlocked ? (
                    <span className="text-[10px] font-bold text-tv-bordeaux/60 uppercase tracking-wider">Ritira in sede →</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-tv-green-deep/20">
                      <Lock size={9} /> Bloccata
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

// ─── User initials avatar ─────────────────────────────────────────────────────

const UserBubble = ({ userId, userName, size = 32 }) => {
  const initial = (userName || "?").charAt(0).toUpperCase();
  const colors = ["bg-tv-green-deep", "bg-tv-bordeaux", "bg-tv-orange", "bg-tv-sky"];
  const colorIdx = userId ? userId.charCodeAt(0) % colors.length : 0;
  return (
    <div className={`${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-black shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initial}
    </div>
  );
};

// ─── Post card ───────────────────────────────────────────────────────────────

const fmtTimeAgo = iso => {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "ora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} giorni fa`;
    return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  } catch { return ""; }
};

const PostCard = ({ post, currentUserId, token, onDelete, onLikeToggle }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [sending, setSending] = useState(false);
  const liked = post.likes?.includes(currentUserId);
  const likeCount = post.likes?.length || 0;

  const handleLike = async () => {
    const r = await fetch(`${API}/api/posts/${post.id}/like`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok) { const d = await r.json(); onLikeToggle(post.id, d.liked, currentUserId); }
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    const r = await fetch(`${API}/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: commentText.trim() }),
    });
    if (r.ok) { const c = await r.json(); setComments(prev => [...prev, c]); setCommentText(""); }
    else toast.error("Errore nell'invio del commento");
    setSending(false);
  };

  const handleDeleteComment = async commentId => {
    const r = await fetch(`${API}/api/posts/${post.id}/comments/${commentId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok) setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="bg-white rounded-3xl border border-tv-green-deep/8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <UserBubble userId={post.user_id} userName={post.user_name} size={36} />
          <div>
            <p className="font-bold text-sm text-tv-green-deep">{post.user_name}</p>
            <p className="text-[10px] text-tv-green-deep/35">{fmtTimeAgo(post.created_at)}</p>
          </div>
        </div>
        {post.user_id === currentUserId && (
          <button onClick={() => onDelete(post.id)}
            className="p-1.5 rounded-full text-tv-green-deep/25 hover:text-tv-bordeaux hover:bg-tv-bordeaux/8 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-tv-green-deep/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.has_image && (
        <img src={post.image_url || post.image_data || `${API}/api/posts/${post.id}/image`}
          alt="post"
          className="w-full max-h-80 object-cover"
          loading="lazy"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-tv-green-deep/8">
        <button onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${liked ? "text-tv-bordeaux" : "text-tv-green-deep/40 hover:text-tv-bordeaux"}`}>
          <Heart size={15} className={liked ? "fill-tv-bordeaux" : ""} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 text-xs font-semibold text-tv-green-deep/40 hover:text-tv-green-deep transition-colors">
          <MessageSquare size={15} />
          {comments.length > 0 && <span>{comments.length}</span>}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-tv-green-deep/8 bg-tv-cream/30 px-5 py-3 flex flex-col gap-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <UserBubble userId={c.user_id} userName={c.user_name} size={26} />
              <div className="flex-1 bg-white rounded-2xl px-3 py-2 min-w-0">
                <p className="text-xs font-bold text-tv-green-deep">{c.user_name}</p>
                <p className="text-xs text-tv-green-deep/70 mt-0.5">{c.content}</p>
              </div>
              {c.user_id === currentUserId && (
                <button onClick={() => handleDeleteComment(c.id)}
                  className="p-1 text-tv-green-deep/20 hover:text-tv-bordeaux transition-colors mt-1">
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
          <form onSubmit={handleComment} className="flex items-center gap-2 mt-1">
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Scrivi un commento…"
              className="flex-1 px-3 py-2 rounded-full text-xs border border-tv-green-deep/15 bg-white focus:border-tv-green focus:outline-none text-tv-green-deep" />
            <button type="submit" disabled={sending || !commentText.trim()}
              className="p-2 rounded-full bg-tv-green-deep text-tv-cream disabled:opacity-40 hover:bg-tv-green transition-colors">
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ─── Post composer ────────────────────────────────────────────────────────────

const PostComposer = ({ user, token, onPost }) => {
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef();

  const handleImage = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Seleziona un'immagine"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setImageData(ev.target.result); setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    const r = await fetch(`${API}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: text.trim(), image_data: imageData }),
    });
    if (r.ok) {
      const post = await r.json();
      onPost(post);
      setText("");
      setImageData(null);
      setImagePreview(null);
      toast.success("Post pubblicato!");
    } else toast.error("Errore nella pubblicazione");
    setPosting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-tv-green-deep/8 p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <UserBubble userId={user.id} userName={user.name} size={36} />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder="Condividi qualcosa con gli altri soci…"
          className="flex-1 px-4 py-2.5 rounded-2xl border border-tv-green-deep/15 bg-tv-cream/40 focus:border-tv-green focus:outline-none text-sm text-tv-green-deep resize-none leading-relaxed" />
      </div>
      {imagePreview && (
        <div className="relative ml-12">
          <img src={imagePreview} alt="preview" className="max-h-40 rounded-2xl object-cover" />
          <button type="button" onClick={() => { setImageData(null); setImagePreview(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between ml-12">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold text-tv-green-deep/40 hover:text-tv-green-deep transition-colors">
          <ImagePlus size={15} /> Foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <button type="submit" disabled={posting || !text.trim()}
          className="px-5 py-2 rounded-full text-sm font-bold bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-40 flex items-center gap-2">
          {posting ? <><Loader2 size={13} className="animate-spin" /> Invio…</> : "Pubblica"}
        </button>
      </div>
    </form>
  );
};

// ─── Area Soci ────────────────────────────────────────────────────────────────

export const AreaSoci = () => {
  const { user, token, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("eventi");

  const [eventsData, setEventsData] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [activeClub, setActiveClub] = useState(CLUBS_CONFIG[0].key);

  // Club del Libro
  const [reviews, setReviews] = useState([]);
  const [votes, setVotes] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [editingProposal, setEditingProposal] = useState(null);
  const [books, setBooks] = useState([]);

  // Cineforum
  const [films, setFilms] = useState([]);
  const [filmReviews, setFilmReviews] = useState([]);
  const [filmVotes, setFilmVotes] = useState([]);
  const [myFilmProposals, setMyFilmProposals] = useState([]);
  const [editingFilmProposal, setEditingFilmProposal] = useState(null);
  const [filmClubLoaded, setFilmClubLoaded] = useState(false);
  const [proposalModal, setProposalModal] = useState(null);
  const [proposteLoaded, setProposteLoaded] = useState(false);

  const [loadingTab, setLoadingTab] = useState(false);

  // Missioni state
  const [missionsData, setMissionsData] = useState(null);

  // Feed state (bacheca nascosta ma codice mantenuto)
  const [posts, setPosts] = useState([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/api/auth/me/member-info`, { headers: h }).then(r => r.ok ? r.json() : {}).then(setMemberInfo);
    fetch(`${API}/api/auth/me/events`, { headers: h }).then(r => r.ok ? r.json() : null).then(setEventsData);
    fetch(`${API}/api/books`).then(r => r.ok ? r.json() : []).then(data => setBooks((data || []).filter(b => b.status === "concluso")));
    fetch(`${API}/api/films`).then(r => r.ok ? r.json() : []).then(data => setFilms((data || []).filter(f => f.status === "concluso")));
  }, [token, navigate]);

  useEffect(() => {
    if (tab !== "clubs") return;
    const h = { Authorization: `Bearer ${token}` };
    if (activeClub === "club-del-libro" && reviews.length === 0 && votes.length === 0) {
      setLoadingTab(true);
      Promise.all([
        fetch(`${API}/api/auth/me/reviews`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/auth/me/votes`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/auth/me/proposals`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]).then(([rev, vot, prop]) => { setReviews(rev); setVotes(vot); setMyProposals(prop); setLoadingTab(false); });
    }
    if (activeClub === "cineforum" && !filmClubLoaded) {
      setLoadingTab(true);
      Promise.all([
        fetch(`${API}/api/auth/me/film-reviews`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/auth/me/film-votes`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/auth/me/film-proposals`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]).then(([rev, vot, prop]) => { setFilmReviews(rev); setFilmVotes(vot); setMyFilmProposals(prop); setFilmClubLoaded(true); setLoadingTab(false); });
    }
  }, [tab, activeClub, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPosts = useCallback(async (skip = 0) => {
    setLoadingPosts(true);
    const r = await fetch(`${API}/api/posts?skip=${skip}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok) {
      const d = await r.json();
      setPosts(prev => skip === 0 ? d.posts : [...prev, ...d.posts]);
      setPostsTotal(d.total);
    }
    setLoadingPosts(false);
    setPostsLoaded(true);
  }, [token]);

  useEffect(() => {
    if (tab === "missioni" && !missionsData) {
      fetch(`${API}/api/auth/me/missions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null).then(setMissionsData);
    }
  }, [tab, missionsData, token]);

  useEffect(() => {
    if (tab !== "proposte" || proposteLoaded) return;
    const h = { Authorization: `Bearer ${token}` };
    setLoadingTab(true);
    Promise.all([
      fetch(`${API}/api/auth/me/votes`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/auth/me/proposals`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/auth/me/film-votes`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/auth/me/film-proposals`, { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([v, p, fv, fp]) => {
      setVotes(v); setMyProposals(p); setFilmVotes(fv); setMyFilmProposals(fp);
      setProposteLoaded(true); setLoadingTab(false);
    });
  }, [tab, proposteLoaded, token]); // eslint-disable-line

  useEffect(() => {
    if (tab === "bacheca" && !postsLoaded) loadPosts(0);
  }, [tab, postsLoaded, loadPosts]);

  const handleNewPost = post => setPosts(prev => [post, ...prev]);

  const handleDeletePost = async postId => {
    const r = await fetch(`${API}/api/posts/${postId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    if (r.ok) { setPosts(prev => prev.filter(p => p.id !== postId)); toast.success("Post eliminato"); }
    else toast.error("Errore nell'eliminazione");
  };

  const handleLikeToggle = (postId, liked, userId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const likes = liked
        ? [...(p.likes || []), userId]
        : (p.likes || []).filter(id => id !== userId);
      return { ...p, likes };
    }));
  };

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
    { key: "eventi",   label: "I miei eventi", icon: Calendar },
    { key: "missioni", label: "Missioni",       icon: Trophy },
    { key: "proposte", label: "Proposte",       icon: ThumbsUp },
    { key: "clubs",    label: "I nostri Club",  icon: BookOpen },
    { key: "profilo",  label: "Profilo",        icon: Edit2 },
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
        <div className="flex gap-1.5 mb-6">
          {/* Missioni — tab in evidenza */}
          <button onClick={() => setTab("missioni")}
            className={`relative flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-black transition-all flex-1 sm:flex-none ${
              tab === "missioni"
                ? "bg-tv-bordeaux text-white shadow-[0_4px_20px_-4px_rgba(120,20,40,0.4)]"
                : "bg-white border border-tv-bordeaux/25 text-tv-bordeaux hover:bg-tv-bordeaux/8"
            }`}>
            <Trophy size={15} />
            <span>Missioni</span>
            {tab !== "missioni" && (
              <span className="w-2 h-2 rounded-full bg-tv-bordeaux animate-pulse absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Altri tab */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-tv-green-deep/8 flex-1">
            {tabs.filter(t => t.key !== "missioni").map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${tab === key ? "bg-tv-green-deep text-tv-cream shadow-sm" : "text-tv-green-deep/55 hover:text-tv-green-deep hover:bg-tv-mint/30"}`}>
                <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
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
                {eventsData.signups.map(ev => {
                  const isPastEvent = ev.event_date && new Date(ev.event_date) < new Date(new Date().toDateString());
                  return (
                    <div key={ev.id} className="flex items-center gap-3 py-3.5 -mx-2 px-2">
                      <Link to={`/eventi/${ev.event_slug || ev.event_id}`}
                        className="flex-1 min-w-0 flex items-center gap-3 hover:bg-tv-mint/20 rounded-xl transition-colors -mx-1 px-1 py-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-tv-green-deep truncate">{ev.event_title}</p>
                          <p className="text-xs text-tv-green-deep/40 mt-0.5">
                            {ev.event_date && <span className="mr-2">📅 {fmtDate(ev.event_date)}</span>}
                            <span>Iscrizione: {fmtDate(ev.created_at)}</span>
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ev.is_waitlist ? "bg-tv-orange/15 text-tv-orange" : ev.confirmed ? "bg-tv-green/15 text-tv-green-deep" : "bg-tv-orange/15 text-tv-orange"}`}>
                          {ev.is_waitlist ? "Lista attesa" : ev.confirmed ? "Confermato" : "In attesa"}
                        </span>
                      </Link>
                      {!isPastEvent && (
                        <button
                          onClick={async () => {
                            if (!window.confirm("Vuoi davvero disdire questa prenotazione?")) return;
                            try {
                              await fetch(`${API}/api/auth/me/signups/${ev.id}`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${localStorage.getItem("socio_token")}` },
                              });
                              toast.success("Prenotazione disdetta.");
                              window.location.reload();
                            } catch {
                              toast.error("Errore nella disdetta. Riprova.");
                            }
                          }}
                          className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border border-tv-bordeaux/25 text-tv-bordeaux/60 hover:bg-tv-bordeaux/8 hover:text-tv-bordeaux hover:border-tv-bordeaux/50 transition-all"
                          title="Disdici prenotazione"
                        >
                          Disdici
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: missioni ── */}
        {tab === "missioni" && (
          <MissioniCards missionsData={missionsData} />
        )}

        {/* ── Tab: bacheca (nascosta, codice mantenuto) ── */}
        {tab === "bacheca" && (
          <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <PostComposer user={user} token={token} onPost={handleNewPost} />

            {loadingPosts && posts.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-tv-green-deep/30">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 text-tv-green-deep/40">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessun post ancora. Sii il primo a condividere qualcosa!</p>
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} currentUserId={user.id} token={token}
                    onDelete={handleDeletePost} onLikeToggle={handleLikeToggle} />
                ))}
                {posts.length < postsTotal && (
                  <button onClick={() => loadPosts(posts.length)} disabled={loadingPosts}
                    className="mx-auto px-6 py-2.5 rounded-full border border-tv-green-deep/20 text-sm font-semibold text-tv-green-deep/60 hover:text-tv-green-deep hover:border-tv-green-deep/40 transition-all disabled:opacity-40 flex items-center gap-2">
                    {loadingPosts ? <Loader2 size={14} className="animate-spin" /> : null}
                    Carica altri post
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: I nostri Club ── */}
        {tab === "clubs" && (
          <div className="flex flex-col gap-6">

            {/* Selettore club dinamico */}
            <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-tv-green-deep/8 w-fit">
              {CLUBS_CONFIG.map(({ key, label, icon: Icon, iconColor }) => (
                <button
                  key={key}
                  onClick={() => setActiveClub(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeClub === key
                      ? "bg-tv-green-deep text-tv-cream shadow-sm"
                      : "text-tv-green-deep/55 hover:text-tv-green-deep hover:bg-tv-mint/30"
                  }`}
                >
                  <Icon size={14} className={activeClub === key ? "" : iconColor} />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Club del Libro ── */}
            {activeClub === "club-del-libro" && (
              <>
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
                  <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare size={16} className="text-tv-green-deep/50" />
                      <h2 className="font-display font-black text-lg text-tv-green-deep">Le mie recensioni</h2>
                    </div>
                    {reviews.length === 0 ? (
                      <p className="text-sm text-tv-green-deep/40 text-center py-4">Nessuna recensione ancora.</p>
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
                )}
              </>
            )}

            {/* ── Cineforum ── */}
            {activeClub === "cineforum" && (
              <>
                <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                  <h2 className="font-display font-black text-lg text-tv-green-deep mb-4">Film visti insieme</h2>
                  {films.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-6">Nessun film concluso ancora.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {films.map(f => (
                        <div key={f.id} className="flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-tv-sky/5 transition-colors">
                          {f.cover_url ? (
                            <img src={f.cover_url} alt={f.title} className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm" />
                          ) : (
                            <div className="w-full aspect-[2/3] bg-tv-sky/10 rounded-xl flex items-center justify-center">
                              <Film size={24} className="text-tv-sky/40" />
                            </div>
                          )}
                          <p className="text-xs font-bold text-tv-green-deep leading-tight line-clamp-2">{f.title}</p>
                          <p className="text-[10px] text-tv-green-deep/45 truncate">{f.director}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {loadingTab ? (
                  <div className="flex items-center justify-center py-10 text-tv-sky/40"><Loader2 size={24} className="animate-spin" /></div>
                ) : (
                  <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare size={16} className="text-tv-sky/60" />
                      <h2 className="font-display font-black text-lg text-tv-green-deep">Le mie recensioni</h2>
                    </div>
                    {filmReviews.length === 0 ? (
                      <p className="text-sm text-tv-green-deep/40 text-center py-4">Nessuna recensione ancora.</p>
                    ) : (
                      <div className="flex flex-col divide-y divide-tv-green-deep/8">
                        {filmReviews.map(r => (
                          <div key={r.id} className="py-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm text-tv-green-deep leading-tight">{r.film_title || "—"}</p>
                              <Stars rating={r.rating} />
                            </div>
                            {r.content && <p className="text-xs text-tv-green-deep/60 mt-1 line-clamp-2">{r.content}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* ── Tab: proposte ── */}
        {tab === "proposte" && (
          <div className="flex flex-col gap-4">
            {loadingTab ? (
              <div className="flex items-center justify-center py-16 text-tv-green-deep/30"><Loader2 size={24} className="animate-spin" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "libri-votati",   label: "Libri votati",    count: votes.length,          Icon: ThumbsUp, color: "text-tv-green-deep/50", bg: "bg-tv-green-deep/8" },
                  { key: "film-votati",    label: "Film votati",     count: filmVotes.length,       Icon: ThumbsUp, color: "text-tv-sky/60",         bg: "bg-tv-sky/10" },
                  { key: "libri-proposti", label: "Libri proposti",  count: myProposals.length,     Icon: Plus,     color: "text-tv-green-deep/50", bg: "bg-tv-green-deep/8" },
                  { key: "film-proposti",  label: "Film proposti",   count: myFilmProposals.length, Icon: Plus,     color: "text-tv-sky/60",         bg: "bg-tv-sky/10" },
                ].map(({ key, label, count, Icon, color, bg }) => (
                  <button key={key} onClick={() => { setProposalModal(key); setEditingProposal(null); setEditingFilmProposal(null); }}
                    className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6 flex flex-col items-start gap-3 hover:border-tv-green-deep/20 hover:shadow-sm transition-all text-left">
                    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                      <Icon size={22} className={color} />
                    </div>
                    <div>
                      <div className="font-display font-black text-3xl text-tv-green-deep">{count}</div>
                      <div className="text-sm font-bold text-tv-green-deep/60 mt-0.5">{label}</div>
                    </div>
                    <span className="text-xs text-tv-green-deep/35">Apri →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Modal proposte ── */}
        {proposalModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setProposalModal(null)}>
            <div className="w-full max-w-2xl bg-tv-cream rounded-[2rem] shadow-2xl mt-8 mb-8 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 sm:px-8 border-b border-tv-green-deep/8">
                <h2 className="font-display font-black text-xl text-tv-green-deep">
                  {proposalModal === "libri-votati"   && "📚 Libri votati"}
                  {proposalModal === "film-votati"    && "🎬 Film votati"}
                  {proposalModal === "libri-proposti" && "📚 Libri proposti da me"}
                  {proposalModal === "film-proposti"  && "🎬 Film proposti da me"}
                </h2>
                <button onClick={() => { setProposalModal(null); setEditingProposal(null); setEditingFilmProposal(null); }}
                  className="p-2 rounded-xl bg-tv-green-deep/10 text-tv-green-deep hover:bg-tv-green-deep/20 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto flex flex-col gap-4">

                {/* LIBRI VOTATI */}
                {proposalModal === "libri-votati" && (
                  votes.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-10">Nessun voto registrato.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {votes.map(p => {
                        const parts = (user.name || "").trim().split(" ");
                        const nome = parts[0] || ""; const cognome = parts.slice(1).join(" ") || "";
                        return (
                          <div key={p.id} className="flex flex-col gap-2">
                            {p.cover_url ? (
                              <img src={p.cover_url} alt={p.title} className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm" />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-tv-green-deep/10 rounded-xl flex items-center justify-center">
                                <BookOpen size={18} className="text-tv-green-deep/30" />
                              </div>
                            )}
                            <p className="text-[11px] font-bold text-tv-green-deep leading-tight line-clamp-2">{p.title}</p>
                            {p.author && <p className="text-[10px] text-tv-green-deep/45 truncate">{p.author}</p>}
                            <button onClick={async () => {
                              const r = await fetch(`${API}/api/proposals/${p.id}/unvote`, {
                                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ nome, cognome })
                              });
                              if (r.ok) { setVotes(prev => prev.filter(v => v.id !== p.id)); toast.success("Voto rimosso!"); }
                              else toast.error("Errore nella rimozione del voto");
                            }} className="text-[10px] font-bold text-tv-bordeaux/60 hover:text-tv-bordeaux underline underline-offset-2 text-left">
                              ✕ Rimuovi voto
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* FILM VOTATI */}
                {proposalModal === "film-votati" && (
                  filmVotes.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-10">Nessun voto registrato.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {filmVotes.map(p => {
                        const parts = (user.name || "").trim().split(" ");
                        const nome = parts[0] || ""; const cognome = parts.slice(1).join(" ") || "";
                        return (
                          <div key={p.id} className="flex flex-col gap-2">
                            {p.cover_url ? (
                              <img src={p.cover_url} alt={p.title} className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm" />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-tv-sky/10 rounded-xl flex items-center justify-center">
                                <Film size={18} className="text-tv-sky/40" />
                              </div>
                            )}
                            <p className="text-[11px] font-bold text-tv-green-deep leading-tight line-clamp-2">{p.title}</p>
                            {p.director && <p className="text-[10px] text-tv-green-deep/45 truncate">{p.director}</p>}
                            <button onClick={async () => {
                              const r = await fetch(`${API}/api/film-proposals/${p.id}/unvote`, {
                                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ nome, cognome })
                              });
                              if (r.ok) { setFilmVotes(prev => prev.filter(v => v.id !== p.id)); toast.success("Voto rimosso!"); }
                              else toast.error("Errore nella rimozione del voto");
                            }} className="text-[10px] font-bold text-tv-bordeaux/60 hover:text-tv-bordeaux underline underline-offset-2 text-left">
                              ✕ Rimuovi voto
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* LIBRI PROPOSTI */}
                {proposalModal === "libri-proposti" && (
                  myProposals.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-10">Nessuna proposta ancora.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {myProposals.map(p => (
                          <div key={p.id} className="flex flex-col gap-2">
                            {p.cover_url ? (
                              <img src={p.cover_url} alt={p.title} className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm" />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-tv-green-deep/10 rounded-xl flex items-center justify-center">
                                <BookOpen size={18} className="text-tv-green-deep/30" />
                              </div>
                            )}
                            <p className="text-[11px] font-bold text-tv-green-deep leading-tight line-clamp-2">{p.title}</p>
                            {p.author && <p className="text-[10px] text-tv-green-deep/45 truncate">{p.author}</p>}
                            <p className="text-[10px] text-tv-green-deep/30">{p.votes} voti</p>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingProposal(ep => ep?.id === p.id ? null : { ...p })}
                                className={`text-[10px] font-bold underline underline-offset-2 ${editingProposal?.id === p.id ? "text-tv-green-deep" : "text-tv-green-deep/40 hover:text-tv-green-deep"}`}>
                                ✏️
                              </button>
                              <button onClick={async () => {
                                if (!window.confirm(`Eliminare "${p.title}"?`)) return;
                                const r = await fetch(`${API}/api/auth/me/proposals/${p.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                                if (r.ok) { setMyProposals(prev => prev.filter(x => x.id !== p.id)); toast.success("Proposta eliminata!"); }
                                else toast.error("Errore nell'eliminazione");
                              }} className="text-[10px] font-bold text-tv-bordeaux/40 hover:text-tv-bordeaux underline underline-offset-2">
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {editingProposal && myProposals.some(p => p.id === editingProposal.id) && (
                        <div className="p-4 bg-white rounded-2xl border border-tv-green-deep/12 flex flex-col gap-3">
                          <p className="text-xs font-black uppercase tracking-wider text-tv-green-deep/40 truncate">✏️ {editingProposal.title}</p>
                          <input className="w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 bg-tv-cream/40 text-sm text-tv-green-deep outline-none" placeholder="Titolo" value={editingProposal.title} onChange={e => setEditingProposal(ep => ({ ...ep, title: e.target.value }))} />
                          <input className="w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 bg-tv-cream/40 text-sm text-tv-green-deep outline-none" placeholder="Autore" value={editingProposal.author || ""} onChange={e => setEditingProposal(ep => ({ ...ep, author: e.target.value }))} />
                          <input className="w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 bg-tv-cream/40 text-sm text-tv-green-deep outline-none" placeholder="URL copertina" value={editingProposal.cover_url || ""} onChange={e => setEditingProposal(ep => ({ ...ep, cover_url: e.target.value }))} />
                          <CoverSearchWidget defaultType="book" onSelect={url => setEditingProposal(ep => ({ ...ep, cover_url: url }))} />
                          <div className="flex gap-2 mt-1">
                            <button className="flex-1 py-2 rounded-xl bg-tv-green-deep text-tv-cream text-sm font-bold" onClick={async () => {
                              const h = { Authorization: `Bearer ${token}` };
                              await fetch(`${API}/api/auth/me/proposals/${editingProposal.id}`, { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ title: editingProposal.title, author: editingProposal.author, cover_url: editingProposal.cover_url }) });
                              setMyProposals(prev => prev.map(x => x.id === editingProposal.id ? { ...x, ...editingProposal } : x));
                              setEditingProposal(null); toast.success("Proposta aggiornata!");
                            }}>Salva</button>
                            <button className="px-4 py-2 rounded-xl border border-tv-green-deep/20 text-tv-green-deep text-sm font-bold" onClick={() => setEditingProposal(null)}>Annulla</button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                )}

                {/* FILM PROPOSTI */}
                {proposalModal === "film-proposti" && (
                  myFilmProposals.length === 0 ? (
                    <p className="text-sm text-tv-green-deep/40 text-center py-10">Nessuna proposta ancora.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                        {myFilmProposals.map(p => (
                          <div key={p.id} className="flex flex-col gap-2">
                            {p.cover_url ? (
                              <img src={p.cover_url} alt={p.title} className="w-full aspect-[2/3] object-cover rounded-xl shadow-sm" />
                            ) : (
                              <div className="w-full aspect-[2/3] bg-tv-sky/10 rounded-xl flex items-center justify-center">
                                <Film size={18} className="text-tv-sky/40" />
                              </div>
                            )}
                            <p className="text-[11px] font-bold text-tv-green-deep leading-tight line-clamp-2">{p.title}</p>
                            {p.director && <p className="text-[10px] text-tv-green-deep/45 truncate">{p.director}</p>}
                            <p className="text-[10px] text-tv-green-deep/30">{p.votes} voti</p>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingFilmProposal(ep => ep?.id === p.id ? null : { ...p })}
                                className={`text-[10px] font-bold underline underline-offset-2 ${editingFilmProposal?.id === p.id ? "text-tv-green-deep" : "text-tv-green-deep/40 hover:text-tv-green-deep"}`}>
                                ✏️
                              </button>
                              <button onClick={async () => {
                                if (!window.confirm(`Eliminare "${p.title}"?`)) return;
                                const r = await fetch(`${API}/api/auth/me/film-proposals/${p.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                                if (r.ok) { setMyFilmProposals(prev => prev.filter(x => x.id !== p.id)); toast.success("Proposta eliminata!"); }
                                else toast.error("Errore nell'eliminazione");
                              }} className="text-[10px] font-bold text-tv-bordeaux/40 hover:text-tv-bordeaux underline underline-offset-2">
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {editingFilmProposal && myFilmProposals.some(p => p.id === editingFilmProposal.id) && (
                        <div className="p-4 bg-white rounded-2xl border border-tv-green-deep/12 flex flex-col gap-3">
                          <p className="text-xs font-black uppercase tracking-wider text-tv-green-deep/40 truncate">✏️ {editingFilmProposal.title}</p>
                          <input className="w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 bg-tv-cream/40 text-sm text-tv-green-deep outline-none" placeholder="Titolo" value={editingFilmProposal.title} onChange={e => setEditingFilmProposal(ep => ({ ...ep, title: e.target.value }))} />
                          <input className="w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 bg-tv-cream/40 text-sm text-tv-green-deep outline-none" placeholder="Regista" value={editingFilmProposal.director || ""} onChange={e => setEditingFilmProposal(ep => ({ ...ep, director: e.target.value }))} />
                          <input className="w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 bg-tv-cream/40 text-sm text-tv-green-deep outline-none" placeholder="URL locandina" value={editingFilmProposal.cover_url || ""} onChange={e => setEditingFilmProposal(ep => ({ ...ep, cover_url: e.target.value }))} />
                          <CoverSearchWidget defaultType="movie" onSelect={url => setEditingFilmProposal(ep => ({ ...ep, cover_url: url }))} />
                          <div className="flex gap-2 mt-1">
                            <button className="flex-1 py-2 rounded-xl bg-tv-green-deep text-tv-cream text-sm font-bold" onClick={async () => {
                              const h = { Authorization: `Bearer ${token}` };
                              await fetch(`${API}/api/auth/me/film-proposals/${editingFilmProposal.id}`, { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ title: editingFilmProposal.title, director: editingFilmProposal.director, cover_url: editingFilmProposal.cover_url }) });
                              setMyFilmProposals(prev => prev.map(x => x.id === editingFilmProposal.id ? { ...x, ...editingFilmProposal } : x));
                              setEditingFilmProposal(null); toast.success("Proposta aggiornata!");
                            }}>Salva</button>
                            <button className="px-4 py-2 rounded-xl border border-tv-green-deep/20 text-tv-green-deep text-sm font-bold" onClick={() => setEditingFilmProposal(null)}>Annulla</button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                )}

              </div>
            </div>
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
