import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Heart, Leaf, BookOpen, Users, CheckCircle, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PrivacyCheckbox, RecaptchaNotice } from "./PrivacyCheckbox";
import { recaptchaHeaders, useRecaptcha, antiSpamMessage } from "../lib/recaptcha";
import { PRIVACY_VERSION } from "../lib/legal";

const API = process.env.REACT_APP_BACKEND_URL;

const AMOUNTS = [5, 10, 20, 50];

const IBAN = "IT48E3688801600100000059432";
const INTESTATARIO = "Trama Viva";

const impact = [
  { icon: Leaf,     title: "Creiamo spazi di incontro", desc: "Passeggiate, laboratori, eventi: ogni esperienza richiede cura, tempo e risorse." },
  { icon: BookOpen, title: "Coltiviamo la cultura",      desc: "Il Club del Libro, le discussioni del Cinema d'Autore, l'attenzione alla prevenzione con gli Screening per la Salute: luoghi dove le idee prendono forma." },
  { icon: Users,    title: "Costruiamo comunità",        desc: "Non eventi isolati, ma una rete di persone che si ritrovano, si conoscono, crescono insieme." },
];

// ─── Sezione successo bonif ───────────────────────────────────────────────────
const SuccessBonifico = ({ name, amount }) => {
  const causale = `Donazione spontanea – ${name}`;
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Copiato!"); };
  return (
    <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(5,47,23,0.12)] p-8 md:p-12 max-w-xl mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-tv-sky/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} className="text-tv-green-deep" />
      </div>
      <h2 className="font-display font-black text-3xl text-tv-green-deep mb-3">Un ultimo passo!</h2>
      <p className="text-tv-green-deep/75 mb-8 leading-relaxed">
        Per completare la donazione, effettua un bonifico con i dati qui sotto. Non appena lo riceveremo, ti contatteremo per ringraziarti.
      </p>
      <div className="bg-tv-cream rounded-2xl p-6 text-left space-y-4 mb-8">
        {[
          ["Intestatario", INTESTATARIO],
          ["IBAN", IBAN],
          ["Causale", causale],
          ...(amount ? [["Importo", `${amount} €`]] : []),
        ].map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-tv-green-deep/75 pt-0.5 shrink-0">{label}</span>
            <div className="flex items-center gap-2 text-right">
              <span className="font-mono text-sm font-bold text-tv-green-deep break-all">{value}</span>
              <button type="button" onClick={() => copy(value)} aria-label={`Copia ${label}`} className="p-1 rounded hover:bg-tv-green-deep/10 transition-colors shrink-0">
                <Copy size={13} className="text-tv-green-deep/75" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-tv-green-deep/75">Per qualsiasi domanda scrivici a <span className="font-bold">tramavivaaps@gmail.com</span></p>
    </div>
  );
};

// ─── Form donazione ───────────────────────────────────────────────────────────
const DonationForm = ({ onSuccess }) => {
  const [amount, setAmount]     = useState(10);
  const [custom, setCustom]     = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [form, setForm]         = useState({ first_name: "", last_name: "", email: "", phone: "", message: "" });
  const [metodo, setMetodo]     = useState("bonifico");
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [privacy, setPrivacy]   = useState(false);
  useRecaptcha();

  const finalAmount = useCustom ? parseFloat(custom) || null : amount;

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Campo obbligatorio";
    if (!form.last_name.trim())  e.last_name  = "Campo obbligatorio";
    if (!form.email.trim())      e.email      = "Campo obbligatorio";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email non valida";
    if (useCustom && (!custom || parseFloat(custom) <= 0)) e.amount = "Inserisci un importo valido";
    if (!privacy) e.privacy = "Per donare devi accettare l'informativa sulla privacy.";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await recaptchaHeaders("donation")) },
        body: JSON.stringify({ ...form, amount: finalAmount, metodo_pagamento: metodo, privacy_accepted: true, privacy_version: PRIVACY_VERSION }),
      });
      if (!res.ok) {
        const err = new Error("Errore server");
        try { err.detail = (await res.json()).detail; } catch { /* risposta non JSON */ }
        throw err;
      }
      const data = await res.json();
      if (metodo === "sumup" && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        onSuccess({ name: `${form.first_name} ${form.last_name}`, amount: finalAmount, id: data.id });
      }
    } catch (err) {
      console.error("Donation error:", err);
      toast.error(antiSpamMessage(err) || "Qualcosa è andato storto. Riprova o scrivici a tramavivaaps@gmail.com");
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = "text", required = true, placeholder = "") => (
    <div>
      <label htmlFor={`donation-${key}`} className="block text-xs font-bold uppercase tracking-widest text-tv-green-deep/75 mb-1.5">{label}{required && " *"}</label>
      <input
        id={`donation-${key}`} required={required} aria-invalid={errors[key] ? "true" : undefined} aria-describedby={errors[key] ? `donation-${key}-error` : undefined}
        autoComplete={key === "email" ? "email" : key === "first_name" ? "given-name" : key === "last_name" ? "family-name" : key === "phone" ? "tel" : undefined}
        type={type} value={form[key]} placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: "" })); }}
        className={`w-full px-4 py-3 rounded-2xl bg-tv-cream border focus:outline-none transition-colors text-tv-green-deep text-sm ${errors[key] ? "border-tv-bordeaux" : "border-tv-green-deep/15 focus:border-tv-green"}`}
      />
      {errors[key] && <p id={`donation-${key}-error`} role="alert" className="text-xs text-tv-bordeaux mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(5,47,23,0.12)] p-8 md:p-10 flex flex-col gap-8">

      {/* Importo */}
      <div>
        <p id="donation-amount-label" className="text-xs font-bold uppercase tracking-widest text-tv-green-deep/75 mb-3">Quanto vuoi donare?</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {AMOUNTS.map(a => (
            <button key={a} type="button" aria-pressed={!useCustom && amount === a}
              onClick={() => { setAmount(a); setUseCustom(false); setErrors(er => ({ ...er, amount: "" })); }}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${!useCustom && amount === a ? "bg-tv-green-deep text-tv-cream shadow-[0_4px_14px_-4px_rgba(5,47,23,0.35)]" : "bg-tv-cream text-tv-green-deep hover:bg-tv-green-deep/10"}`}>
              {a} €
            </button>
          ))}
          <button type="button" aria-pressed={useCustom}
            onClick={() => setUseCustom(true)}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${useCustom ? "bg-tv-green-deep text-tv-cream shadow-[0_4px_14px_-4px_rgba(5,47,23,0.35)]" : "bg-tv-cream text-tv-green-deep hover:bg-tv-green-deep/10"}`}>
            Libero
          </button>
        </div>
        {useCustom && (
          <div className="relative max-w-[160px]">
            <input type="number" min="1" step="0.01" placeholder="0.00" value={custom} aria-label="Importo libero in euro" aria-invalid={errors.amount ? "true" : undefined}
              onChange={e => { setCustom(e.target.value); setErrors(er => ({ ...er, amount: "" })); }}
              className={`w-full pl-4 pr-8 py-3 rounded-2xl bg-tv-cream border focus:outline-none text-tv-green-deep text-sm font-bold ${errors.amount ? "border-tv-bordeaux" : "border-tv-green-deep/15 focus:border-tv-green"}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tv-green-deep/75 font-bold text-sm">€</span>
          </div>
        )}
        {errors.amount && <p role="alert" className="text-xs text-tv-bordeaux mt-1">{errors.amount}</p>}
        <p className="text-xs text-tv-green-deep/75 mt-2">Anche una piccola somma fa la differenza. Puoi anche non specificare un importo per il bonifico.</p>
      </div>

      {/* Dati personali */}
      <div className="grid sm:grid-cols-2 gap-4">
        {field("first_name", "Nome")}
        {field("last_name",  "Cognome")}
      </div>
      {field("email", "Email", "email")}
      {field("phone", "Telefono", "tel", false, "Facoltativo")}

      {/* Messaggio */}
      <div>
        <label htmlFor="donation-message" className="block text-xs font-bold uppercase tracking-widest text-tv-green-deep/75 mb-1.5">Un messaggio per noi <span className="normal-case text-tv-green-deep/75">(facoltativo)</span></label>
        <textarea id="donation-message" rows={3} value={form.message} placeholder="Cosa ti ha spinto a donarci? O semplicemente: grazie 💚"
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          className="w-full px-4 py-3 rounded-2xl bg-tv-cream border border-tv-green-deep/15 focus:border-tv-green focus:outline-none resize-none text-tv-green-deep text-sm transition-colors"
        />
      </div>

      {/* Metodo pagamento */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-tv-green-deep/75 mb-3">Come vuoi pagare?</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { key: "bonifico", label: "Bonifico bancario", desc: "Riceverai i dati IBAN subito dopo" },
            { key: "sumup",    label: "Carta",              desc: "Pagamento online sicuro, subito" },
          ].map(({ key, label, desc }) => (
            <button key={key} type="button" aria-pressed={metodo === key} onClick={() => setMetodo(key)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${metodo === key ? "border-tv-green-deep bg-tv-green-deep/5" : "border-tv-green-deep/12 hover:border-tv-green-deep/25"}`}>
              <div className={`font-bold text-sm mb-0.5 ${metodo === key ? "text-tv-green-deep" : "text-tv-green-deep/75"}`}>{label}</div>
              <div className="text-xs text-tv-green-deep/75">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Consenso privacy */}
      <PrivacyCheckbox
        id="donation-privacy"
        checked={privacy}
        onChange={e => { setPrivacy(e.target.checked); setErrors(er => ({ ...er, privacy: "" })); }}
        purpose="registrare la mia donazione e ricevere il ringraziamento"
        error={errors.privacy}
      />

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="btn-tv bg-tv-bordeaux text-tv-cream font-black text-base py-4 rounded-full flex items-center justify-center gap-2 hover:bg-tv-bordeaux/90 transition-all shadow-[0_6px_20px_-6px_rgba(93,23,35,0.4)] disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} />}
        {loading ? "Un momento…" : metodo === "sumup" ? "Vai al pagamento →" : "Dona con bonifico →"}
      </button>

      <p className="text-center text-xs text-tv-green-deep/75">
        I tuoi dati sono trattati con cura. Nessun abbonamento, nessun obbligo.
      </p>
      <RecaptchaNotice className="text-center -mt-4" />
    </form>
  );
};

// ─── Pagina principale ────────────────────────────────────────────────────────
export const Donazioni = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [success, setSuccess] = useState(null);
  const [sumupState, setSumupState] = useState(null); // null | "checking" | "paid" | "unpaid"
  const formRef = useRef();

  useEffect(() => {
    window.scrollTo(0, 0);
    const grazie = searchParams.get("grazie");
    if (!grazie) return;
    setSuccess({ name: "Amico", amount: null, id: grazie, fromSumup: true });
    setSumupState("checking");
    fetch(`${API}/api/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_id: grazie }),
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("verify failed"))))
      .then(d => setSumupState(d.paid ? "paid" : "unpaid"))
      .catch(() => setSumupState("unpaid"));
  }, [searchParams]);

  const retryDonation = () => {
    setSuccess(null);
    setSumupState(null);
    setSearchParams({}, { replace: true });
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-tv-cream min-h-screen">
      <Navbar />
      <main id="main">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 md:px-10 pt-24 pb-0">
        {/* Filo decorativo */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="none">
            <g stroke="#052F17" strokeWidth="1.5" fill="none">
              {Array.from({ length: 14 }).map((_, i) => (
                <path key={i} d={`M0 ${i * 36} Q 500 ${i * 36 + 60} 1000 ${i * 36}`} />
              ))}
            </g>
          </svg>
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 bg-tv-green-deep/8 text-tv-green-deep text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            <Heart size={12} className="text-tv-bordeaux" fill="currentColor" style={{ color: "#5d1723" }} />
            Supportaci
          </div>
          <h1 className="font-display font-black text-3xl md:text-5xl text-tv-green-deep leading-[0.95] mb-3">
            Fai fiorire{" "}
            <span className="italic font-light">qualcosa di bello.</span>
          </h1>
          <p className="text-tv-green-deep/75 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Trama Viva vive grazie alle persone che ci credono. Se vuoi che queste esperienze continuino, puoi sostenerci con una donazione spontanea, grande o piccola.
          </p>
        </div>
      </section>

      {/* ── Perché donare ── */}
      <section className="px-6 md:px-10 py-5">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-3 gap-3">
          {impact.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-3xl p-4 flex items-start gap-3 shadow-[0_4px_20px_-8px_rgba(5,47,23,0.1)]">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-tv-mint/30 flex items-center justify-center">
                <Icon size={16} className="text-tv-green" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-tv-green-deep mb-0.5">{title}</h3>
                <p className="text-sm text-tv-green-deep/75 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Form / Successo ── */}
      <section ref={formRef} className="px-6 md:px-10 py-6 md:py-8 scroll-mt-8">
        <div className="mx-auto max-w-xl">
          {success ? (
            success.fromSumup ? (
              sumupState === "paid" ? (
                <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(5,47,23,0.12)] p-8 md:p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-tv-mint/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-tv-green" />
                  </div>
                  <h2 className="font-display font-black text-3xl text-tv-green-deep mb-3">Grazie!</h2>
                  <p className="text-tv-green-deep/75 leading-relaxed">Il tuo pagamento è stato ricevuto. Grazie di cuore per il tuo sostegno — significa molto per tutta la comunità di Trama Viva.</p>
                </div>
              ) : sumupState === "unpaid" ? (
                <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(5,47,23,0.12)] p-8 md:p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-tv-orange/15 flex items-center justify-center mx-auto mb-6">
                    <Heart size={32} className="text-tv-orange" />
                  </div>
                  <h2 className="font-display font-black text-3xl text-tv-green-deep mb-3">Pagamento non completato</h2>
                  <p className="text-tv-green-deep/75 leading-relaxed mb-6">Non risulta ancora nessun pagamento per questa donazione. Se hai interrotto l'operazione puoi riprovare quando vuoi; se invece hai pagato, scrivici a <span className="font-bold">tramavivaaps@gmail.com</span> e verificheremo subito.</p>
                  <button onClick={retryDonation} className="btn-tv px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold">
                    Riprova a donare
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(5,47,23,0.12)] p-8 md:p-12 text-center">
                  <Loader2 size={32} className="animate-spin text-tv-green mx-auto mb-4" />
                  <p className="text-tv-green-deep/75">Stiamo verificando il tuo pagamento…</p>
                </div>
              )
            ) : (
              <SuccessBonifico name={success.name} amount={success.amount} />
            )
          ) : (
            <>
              <div className="text-center mb-5">
                <h2 className="font-display font-black text-2xl md:text-3xl text-tv-green-deep mb-1">Dona ora</h2>
                <p className="text-tv-green-deep/75 text-sm">Scegli liberamente quanto e come. Non c'è un importo giusto o sbagliato.</p>
              </div>
              <DonationForm onSuccess={setSuccess} />
            </>
          )}
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
};

// ─── Teaser per homepage ──────────────────────────────────────────────────────
export const DonazioniTeaser = () => (
  <section className="px-6 md:px-10 py-5">
    <div className="mx-auto max-w-7xl">
      <div className="relative bg-tv-green-deep rounded-[2.5rem] overflow-hidden px-8 md:px-12 py-6 md:py-7 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
        {/* Filo */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <svg viewBox="0 0 900 200" className="w-full h-full" preserveAspectRatio="none">
            <g stroke="#F9ECD4" strokeWidth="1" fill="none">
              {Array.from({ length: 8 }).map((_, i) => (
                <path key={i} d={`M0 ${i * 28} Q 450 ${i * 28 + 40} 900 ${i * 28}`} />
              ))}
            </g>
          </svg>
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-tv-cream/15 text-tv-cream text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
            <Heart size={11} fill="currentColor" /> Supportaci
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-tv-cream leading-tight">
            Ogni filo tiene{" "}
            <span className="italic font-light">insieme la trama.</span>
          </h2>
          <p className="text-tv-cream/60 mt-1.5 max-w-md text-sm leading-snug">
            Con una donazione spontanea aiuti Trama Viva a continuare a creare spazi di incontro, cultura e comunità.
          </p>
        </div>
        <a href="/donazioni"
          className="relative shrink-0 bg-tv-cream text-tv-green-deep font-black px-7 py-3 rounded-full hover:bg-tv-mint transition-all shadow-[0_6px_20px_-6px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 flex items-center gap-2 text-sm whitespace-nowrap">
          <Heart size={15} /> Dona ora
        </a>
      </div>
    </div>
  </section>
);

export default Donazioni;
