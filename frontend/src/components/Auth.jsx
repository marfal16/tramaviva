import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { Logo } from "./Logo";

const API = process.env.REACT_APP_BACKEND_URL;

const AuthCard = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-tv-cream flex flex-col items-center justify-center px-4 py-12">
    <Link to="/" className="mb-8">
      <Logo size={40} />
    </Link>
    <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(5,47,23,0.15)] border border-tv-green-deep/8 p-8 md:p-10">
      <h1 className="font-display font-black text-2xl md:text-3xl text-tv-green-deep mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-tv-green-deep/55 mb-7">{subtitle}</p>}
      {children}
    </div>
  </div>
);

const Field = ({ label, type = "text", value, onChange, placeholder, required }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/60">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 rounded-2xl border border-tv-green-deep/15 bg-tv-cream/40 focus:border-tv-green focus:outline-none text-tv-green-deep text-sm"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tv-green-deep/40 hover:text-tv-green-deep transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || "Errore di login"); return; }
      login(data.token, data.user);
      navigate("/area-soci");
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Bentornato/a 👋" subtitle="Accedi alla tua area soci Trama Viva">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="la-tua@email.it" required />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required />
        <div className="text-right">
          <Link to="/password-dimenticata" className="text-xs text-tv-green-deep/50 hover:text-tv-green-deep transition-colors">
            Password dimenticata?
          </Link>
        </div>
        <button type="submit" disabled={loading}
          className="mt-2 w-full px-5 py-3.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Accesso…</> : "Accedi"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-tv-green-deep/50">
        Non hai ancora un account?{" "}
        <Link to="/registrati" className="font-bold text-tv-green-deep hover:text-tv-green transition-colors">Registrati</Link>
      </p>
    </AuthCard>
  );
};

// ─── Registrazione ────────────────────────────────────────────────────────────

export const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Le password non coincidono."); return; }
    if (form.password.length < 8) { toast.error("La password deve essere di almeno 8 caratteri."); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || "Errore nella registrazione"); return; }
      login(data.token, data.user);
      toast.success("Account creato! Benvenuto/a nell'area soci.");
      navigate("/area-soci");
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Crea il tuo account" subtitle="Solo per soci Trama Viva — usa l'email con cui ti sei iscritto/a">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nome e cognome" value={form.name} onChange={set("name")} placeholder="Mario Rossi" required />
        <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="la-tua@email.it" required />
        <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 caratteri" required />
        <Field label="Conferma password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Ripeti la password" required />
        <button type="submit" disabled={loading}
          className="mt-2 w-full px-5 py-3.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Registrazione…</> : "Crea account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-tv-green-deep/50">
        Hai già un account?{" "}
        <Link to="/login" className="font-bold text-tv-green-deep hover:text-tv-green transition-colors">Accedi</Link>
      </p>
    </AuthCard>
  );
};

// ─── Password dimenticata ─────────────────────────────────────────────────────

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Password dimenticata" subtitle="Ti mandiamo un link per reimpostare la password">
      {sent ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">📬</div>
          <p className="text-sm text-tv-green-deep/70 leading-relaxed">
            Se l'email è associata a un account, riceverai un link entro qualche minuto.<br />
            Controlla anche la cartella spam.
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep/60 hover:text-tv-green-deep transition-colors">
            <ArrowLeft size={14} /> Torna al login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="la-tua@email.it" required />
          <button type="submit" disabled={loading}
            className="mt-2 w-full px-5 py-3.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Invio…</> : "Invia link di reset"}
          </button>
          <Link to="/login" className="text-center text-sm text-tv-green-deep/50 hover:text-tv-green-deep transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={13} /> Torna al login
          </Link>
        </form>
      )}
    </AuthCard>
  );
};

// ─── Reset password ───────────────────────────────────────────────────────────

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const token = window.location.pathname.split("/reset-password/")[1] || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Le password non coincidono."); return; }
    if (form.password.length < 8) { toast.error("La password deve essere di almeno 8 caratteri."); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: form.password }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.detail || "Link non valido o scaduto."); return; }
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Nuova password" subtitle="Scegli una nuova password per il tuo account">
      {done ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm text-tv-green-deep/70">Password reimpostata! Verrai reindirizzato al login…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nuova password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 caratteri" required />
          <Field label="Conferma password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Ripeti la password" required />
          <button type="submit" disabled={loading}
            className="mt-2 w-full px-5 py-3.5 rounded-full font-bold text-sm bg-tv-green-deep text-tv-cream hover:bg-tv-green transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Salvataggio…</> : "Salva nuova password"}
          </button>
        </form>
      )}
    </AuthCard>
  );
};
