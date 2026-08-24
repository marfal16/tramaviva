import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  LogOut, Camera, Edit2, Check, X, Calendar, ChevronRight,
  Loader2, Lock, Star, BookOpen, Film, MessageSquare, ThumbsUp, Award,
  Heart, Send, Trash2, ImagePlus, Users, Trophy, Gift
} from "lucide-react";
import Navbar from "./Navbar";
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

// ─── Missioni: count-up hook ──────────────────────────────────────────────────

const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let current = 0;
    const inc = target / (duration / 16);
    const t = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return count;
};

// ─── Missioni: HoloCard con tilt 3D + glow olografico ────────────────────────

const HoloCard = ({ children, unlocked, cardStyle, className, delay = 0 }) => {
  const ref = useRef();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const onMove = e => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({ x: (y - 0.5) * 18, y: (0.5 - x) * 18 });
    setGlow({ x: x * 100, y: y * 100 });
  };

  return (
    <div ref={ref} onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHover(false); }}
      className={className}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${visible ? 0 : 28}px)`,
        opacity: visible ? 1 : 0,
        transition: hover ? 'transform 0.1s ease, opacity 0.5s ease' : 'transform 0.55s ease, opacity 0.55s ease',
        position: 'relative',
        ...cardStyle,
      }}>
      {/* Olographic cursor glow */}
      {unlocked && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 1,
          background: `radial-gradient(ellipse 55% 45% at ${glow.x}% ${glow.y}%, rgba(251,191,36,0.2) 0%, transparent 65%)`,
          opacity: hover ? 1 : 0, transition: 'opacity 0.3s',
        }} />
      )}
      {children}
    </div>
  );
};

// ─── Missioni: componente principale gamer ────────────────────────────────────

const MissioniGamer = ({ missionsData, user, API }) => {
  const [xpW, setXpW] = useState(0);
  const eventCount = useCountUp(missionsData?.event_count || 0, 1100);
  const unlockedCount = (missionsData?.missions || []).filter(m => m.unlocked).length;
  const next = (missionsData?.missions || []).find(m => !m.unlocked);
  const xpPct = next ? Math.min(100, (next.current_count / next.required_events) * 100) : 100;
  const level = Math.floor((missionsData?.event_count || 0) / 3) + 1;

  useEffect(() => { const t = setTimeout(() => setXpW(xpPct), 400); return () => clearTimeout(t); }, [xpPct]);

  return (
    <>
      <style>{`
        @keyframes tvOrb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(45px,-30px) scale(1.07)}66%{transform:translate(-25px,18px) scale(0.94)}}
        @keyframes tvOrb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-55px,40px) scale(1.1)}}
        @keyframes tvOrb3{0%,100%{transform:translate(0,0)}40%{transform:translate(30px,50px)}80%{transform:translate(-18px,-22px)}}
        @keyframes tvPulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes tvShimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes tvRing{0%{box-shadow:0 0 0 0 rgba(251,191,36,.45)}100%{box-shadow:0 0 0 14px rgba(251,191,36,0)}}
        @keyframes tvGrid{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
        .tv-holo-card-unlocked{animation:tvRing 2.5s ease-out infinite}
        .tv-shimmer{background:linear-gradient(90deg,#f59e0b 0%,#fde68a 40%,#f59e0b 60%,#fbbf24 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:tvShimmer 3s linear infinite}
        .tv-xp-bar{transition:width 1.3s cubic-bezier(.22,1,.36,1)}
      `}</style>

      <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(155deg,#060d07 0%,#0b1e0e 45%,#060d07 100%)' }}>

        {/* Floating orbs */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'-8%', left:'18%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,197,94,.1) 0%,transparent 70%)', animation:'tvOrb1 14s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'8%', right:'10%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(251,191,36,.09) 0%,transparent 70%)', animation:'tvOrb2 17s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'45%', left:'3%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.07) 0%,transparent 70%)', animation:'tvOrb3 20s ease-in-out infinite' }} />
          {/* Grid */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)', backgroundSize:'64px 64px', animation:'tvGrid 4s ease-in-out infinite' }} />
        </div>

        <div className="relative p-6 md:p-10 flex flex-col gap-10">

          {/* ── Player header ── */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:90, height:90, borderRadius:20, overflow:'hidden', border:'2px solid rgba(251,191,36,.45)', boxShadow:'0 0 32px rgba(251,191,36,.2), inset 0 0 20px rgba(251,191,36,.04)' }}>
                {user.has_avatar
                  ? <img src={`${API}/api/users/${user.id}/avatar`} alt={user.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', background:'rgba(251,191,36,.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, fontWeight:900, color:'#f59e0b' }}>{user.name?.charAt(0)?.toUpperCase()}</div>
                }
              </div>
              <div style={{ position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#451a03', fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:99, whiteSpace:'nowrap', boxShadow:'0 0 14px rgba(251,191,36,.65)', letterSpacing:'0.12em' }}>
                LV {level}
              </div>
            </div>

            {/* Name + XP bar */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:2 }}>
                <span className="tv-shimmer" style={{ fontWeight:900, fontSize:26, lineHeight:1 }}>{user.name}</span>
                {missionsData?.is_fondatore && (
                  <span style={{ fontSize:8, fontWeight:900, letterSpacing:'0.2em', background:'rgba(251,191,36,.14)', color:'#fbbf24', border:'1px solid rgba(251,191,36,.4)', padding:'3px 8px', borderRadius:99, textTransform:'uppercase' }}>Fondatore</span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:14 }}>
                <span style={{ fontWeight:900, fontSize:60, lineHeight:1, color:'white' }}>{eventCount}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em' }}>XP</span>
              </div>
              {/* XP bar */}
              {next ? (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                      Next: <span style={{ color:'#fbbf24' }}>{next.title}</span>
                    </span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,.2)', fontWeight:700 }}>{next.current_count}/{next.required_events}</span>
                  </div>
                  <div style={{ height:8, borderRadius:99, overflow:'hidden', background:'rgba(255,255,255,.07)', position:'relative' }}>
                    <div className="tv-xp-bar" style={{ height:'100%', width:`${xpW}%`, background:'linear-gradient(90deg,#15803d,#22c55e,#f59e0b)', boxShadow:'0 0 16px rgba(251,191,36,.7), 0 0 6px rgba(34,197,94,.5)', borderRadius:99 }} />
                    {xpW > 2 && xpW < 99 && (
                      <div style={{ position:'absolute', top:'50%', left:`${xpW}%`, transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 18px #f59e0b', animation:'tvPulse 1.4s ease-in-out infinite' }} />
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#fbbf24', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  <Trophy size={15} /> Tutte le missioni completate!
                </div>
              )}
            </div>

            {/* Stat boxes */}
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              {[{v:unlockedCount,l:'sbloccate',c:'#f59e0b'},{v:(missionsData?.missions||[]).length-unlockedCount,l:'bloccate',c:'rgba(255,255,255,.2)'}].map(({v,l,c})=>(
                <div key={l} style={{ textAlign:'center', padding:'12px 16px', borderRadius:16, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ fontWeight:900, fontSize:28, color:c, lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(251,191,36,.25) 30%,rgba(34,197,94,.2) 70%,transparent)' }} />

          {/* ── Achievement grid ── */}
          {(missionsData?.missions||[]).length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'rgba(255,255,255,.15)' }}>
              <Trophy size={40} style={{ margin:'0 auto 12px' }} />
              <p style={{ fontSize:14 }}>Le missioni saranno presto disponibili.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:16 }}>
              {(missionsData.missions||[]).map((m, i) => {
                const pct = Math.min(100, (m.current_count / m.required_events) * 100);
                const remaining = m.required_events - m.current_count;
                return (
                  <HoloCard key={m.id} unlocked={m.unlocked} delay={i * 90}
                    className={m.unlocked ? 'tv-holo-card-unlocked' : ''}
                    cardStyle={m.unlocked ? {
                      background:'linear-gradient(135deg,rgba(251,191,36,.07),rgba(34,197,94,.04))',
                      border:'1px solid rgba(251,191,36,.3)', borderRadius:20,
                    } : {
                      background:'rgba(255,255,255,.025)',
                      border:'1px solid rgba(255,255,255,.06)', borderRadius:20,
                    }}>
                    {/* Top progress strip */}
                    <div style={{ height:3, background:'rgba(255,255,255,.05)', borderRadius:'20px 20px 0 0', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:m.unlocked?'linear-gradient(90deg,#22c55e,#f59e0b)':'rgba(255,255,255,.1)', boxShadow:m.unlocked?'0 0 10px rgba(251,191,36,.8)':'none', transition:'width 1.3s cubic-bezier(.22,1,.36,1) .4s' }} />
                    </div>

                    <div style={{ padding:'18px 18px 14px', position:'relative', zIndex:2 }}>
                      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                        {/* Icon */}
                        <div style={{ position:'relative', flexShrink:0 }}>
                          <div style={{ width:56, height:56, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                            background:m.unlocked?'rgba(251,191,36,.1)':'rgba(255,255,255,.04)',
                            border:m.unlocked?'1px solid rgba(251,191,36,.35)':'1px solid rgba(255,255,255,.06)',
                            boxShadow:m.unlocked?'0 0 22px rgba(251,191,36,.22)':'none',
                            filter:m.unlocked?'none':'grayscale(1)', opacity:m.unlocked?1:.3 }}>
                            {m.emoji}
                          </div>
                          <div style={{ position:'absolute', bottom:-7, right:-7, width:23, height:23, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            background:m.unlocked?'linear-gradient(135deg,#f59e0b,#fbbf24)':'rgba(255,255,255,.08)',
                            boxShadow:m.unlocked?'0 0 14px rgba(251,191,36,.75)':'none',
                            border:m.unlocked?'none':'1px solid rgba(255,255,255,.1)' }}>
                            {m.unlocked ? <Award size={12} color="#451a03" /> : <Lock size={10} color="rgba(255,255,255,.25)" />}
                          </div>
                        </div>

                        {/* Text */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                            <span style={{ fontWeight:900, fontSize:13, color:m.unlocked?'white':'rgba(255,255,255,.3)', lineHeight:1.2 }}>{m.title}</span>
                            {m.unlocked && (
                              <span style={{ fontSize:8, fontWeight:900, letterSpacing:'0.18em', background:'rgba(251,191,36,.18)', color:'#fbbf24', border:'1px solid rgba(251,191,36,.4)', padding:'2px 6px', borderRadius:99, textTransform:'uppercase', flexShrink:0 }}>✓ Sbloccato</span>
                            )}
                          </div>
                          {(m.event_title||m.category) && (
                            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:m.unlocked?'rgba(34,197,94,.8)':'rgba(255,255,255,.2)', display:'inline-block', marginBottom:5 }}>
                              ◆ {m.event_title||m.category}
                            </span>
                          )}
                          <p style={{ fontSize:11, color:m.unlocked?'rgba(255,255,255,.45)':'rgba(255,255,255,.18)', lineHeight:1.5 }}>{m.description}</p>
                        </div>
                      </div>

                      {/* Reward + status */}
                      <div style={{ marginTop:14, paddingTop:12, borderTop:m.unlocked?'1px solid rgba(251,191,36,.12)':'1px solid rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, color:m.unlocked?'#f59e0b':'rgba(255,255,255,.18)', fontSize:11, fontWeight:700 }}>
                          <Gift size={12} />{m.reward}
                        </div>
                        {m.unlocked ? (
                          <span style={{ fontSize:9, fontWeight:900, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(251,191,36,.65)' }}>Ritira in sede →</span>
                        ) : (
                          <span style={{ fontSize:9, color:'rgba(255,255,255,.15)', fontWeight:700 }}>
                            {m.event_id ? '🔒 Partecipa' : `${m.current_count}/${m.required_events}`}
                          </span>
                        )}
                      </div>

                      {/* Locked hint */}
                      {!m.unlocked && (
                        <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:5, fontSize:9, color:'rgba(255,255,255,.15)', fontWeight:600 }}>
                          <Lock size={8} />
                          {m.event_id ? `Partecipa a "${m.event_title||'questo evento'}"` : `Ancora ${remaining} event${remaining===1?'o':'i'}${m.category?` "${m.category}"`:''}` }
                        </div>
                      )}
                    </div>
                  </HoloCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
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

      {/* Image — usa il base64 inline se disponibile, evita una request separata */}
      {post.has_image && (post.image_data || post.id) && (
        <img src={post.image_data || `${API}/api/posts/${post.id}/image`}
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
  const [books, setBooks] = useState([]);

  // Cineforum
  const [films, setFilms] = useState([]);
  const [filmReviews, setFilmReviews] = useState([]);
  const [filmVotes, setFilmVotes] = useState([]);
  const [filmClubLoaded, setFilmClubLoaded] = useState(false);

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
      ]).then(([rev, vot]) => { setReviews(rev); setVotes(vot); setLoadingTab(false); });
    }
    if (activeClub === "cineforum" && !filmClubLoaded) {
      setLoadingTab(true);
      Promise.all([
        fetch(`${API}/api/auth/me/film-reviews`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`${API}/api/auth/me/film-votes`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]).then(([rev, vot]) => { setFilmReviews(rev); setFilmVotes(vot); setFilmClubLoaded(true); setLoadingTab(false); });
    }
  }, [tab, activeClub, token]);

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
    { key: "eventi",  label: "I miei eventi",  icon: Calendar },
    { key: "missioni", label: "Missioni",       icon: Trophy },
    { key: "clubs",   label: "I nostri Club",  icon: BookOpen },
    { key: "profilo", label: "Profilo",         icon: Edit2 },
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

        {/* ── Tab: missioni (gamer UI) ── */}
        {tab === "missioni" && (
          <MissioniGamer missionsData={missionsData} user={user} API={API} />
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
                  <div className="grid md:grid-cols-2 gap-6">
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={16} className="text-tv-sky/60" />
                        <h2 className="font-display font-black text-lg text-tv-green-deep">Le mie recensioni</h2>
                      </div>
                      {filmReviews.length === 0 ? (
                        <p className="text-sm text-tv-green-deep/40 text-center py-6">Nessuna recensione ancora.</p>
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
                    <div className="bg-white rounded-[2rem] border border-tv-green-deep/8 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ThumbsUp size={16} className="text-tv-sky/60" />
                        <h2 className="font-display font-black text-lg text-tv-green-deep">Proposte votate</h2>
                      </div>
                      {filmVotes.length === 0 ? (
                        <p className="text-sm text-tv-green-deep/40 text-center py-6">Nessun voto registrato.</p>
                      ) : (
                        <div className="flex flex-col divide-y divide-tv-green-deep/8">
                          {filmVotes.map(p => (
                            <div key={p.id} className="py-3.5 flex items-start gap-3">
                              {p.cover_url ? (
                                <img src={p.cover_url} alt={p.title} className="w-9 h-12 object-cover rounded-lg shrink-0 shadow-sm" />
                              ) : (
                                <div className="w-9 h-12 bg-tv-sky/10 rounded-lg flex items-center justify-center shrink-0">
                                  <Film size={14} className="text-tv-sky/40" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-tv-green-deep leading-tight truncate">{p.title}</p>
                                {p.director && <p className="text-xs text-tv-green-deep/50 truncate">{p.director}</p>}
                                <p className="text-[10px] text-tv-green-deep/35 mt-0.5">{fmtMonth(p.proposed_month)} · {p.votes} voti totali</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
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
