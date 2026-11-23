import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Instagram, Mail, Send, Facebook } from "lucide-react";
import { PrivacyCheckbox, RecaptchaNotice } from "./PrivacyCheckbox";
import { recaptchaHeaders, useRecaptcha, antiSpamMessage } from "../lib/recaptcha";
import { PRIVACY_VERSION } from "../lib/legal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SOCIAL = [
  {
    icon: Mail,
    label: "Email",
    value: "tramavivaaps@gmail.com",
    href: "mailto:tramavivaaps@gmail.com",
    testId: "contact-email-link",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@tramavivaaps",
    href: "https://www.instagram.com/tramavivaaps/",
    testId: "contact-instagram-link",
  },
  {
    icon: Facebook,
    label: "Facebook",
    value: "Trama Viva APS",
    href: "https://www.facebook.com/share/1DfEqcoruN/?mibextid=wwXIfr",
    testId: "contact-facebook-link",
  },
  {
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
      </svg>
    ),
    label: "TikTok",
    value: "@tramavivaaps",
    href: "https://www.tiktok.com/@tramavivaaps",
    testId: "contact-tiktok-link",
  },
];

export const Contatti = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [privacy, setPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useRecaptcha();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Compila tutti i campi.");
      return;
    }
    if (!privacy) {
      setPrivacyError("Per inviare il messaggio devi accettare l'informativa sulla privacy.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${API}/contact`,
        { ...form, privacy_accepted: true, privacy_version: PRIVACY_VERSION },
        { headers: await recaptchaHeaders("contact") }
      );
      toast.success("Messaggio inviato. Grazie!");
      setForm({ name: "", email: "", message: "" });
      setPrivacy(false);
    } catch (e) {
      toast.error(antiSpamMessage(e) || "Errore nell'invio. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contatti"
      data-testid="contatti-section"
      className="relative py-10 md:py-12 bg-tv-sky/30 overflow-hidden scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">

        {/* Header centrato */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-2">
            Scrivici
          </div>
          <h2 className="font-display font-black text-3xl md:text-4xl lg:text-5xl leading-[0.95] text-tv-green-deep">
            Due righe,{" "}
            <span className="italic font-light text-tv-bordeaux">un nuovo filo</span>.
          </h2>
          <p className="mt-3 text-base md:text-lg text-tv-green-deep/75 leading-relaxed">
            Una proposta, una collaborazione, un feedback? Scrivici qui o trovaci sui nostri canali.
          </p>
        </div>

        {/* Griglia: canali a sinistra, form a destra */}
        <div className="grid md:grid-cols-5 gap-5 md:gap-6 items-start max-w-5xl mx-auto">

          {/* Canali */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-tv-green-deep/75 mb-2">
              Trovaci anche qui
            </p>
            <div className="space-y-1.5">
              {SOCIAL.map(({ icon: Icon, label, value, href, testId }) => (
                <a
                  key={label}
                  href={href}
                  data-testid={testId}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  referrerPolicy={href.startsWith("http") ? "no-referrer" : undefined}
                  className="group flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-tv-green-deep/10 hover:border-tv-green-deep/30 hover:shadow-sm transition-all"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-tv-sky/50 flex items-center justify-center text-tv-bordeaux group-hover:bg-tv-bordeaux/10 transition-colors">
                    <Icon size={16} />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-tv-green-deep/75">{label}</div>
                    <div className="font-semibold text-tv-green-deep text-sm">{value}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={submit}
            data-testid="contact-form"
            className="md:col-span-3 bg-white rounded-[2rem] p-5 md:p-6 border border-tv-green-deep/10"
          >
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="font-display font-black text-lg md:text-xl text-tv-green-deep leading-tight">
                Scrivici un messaggio.
              </div>
              <div className="text-xs text-tv-green-deep/75">
                Rispondiamo in breve tempo, promesso.
              </div>
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="grid sm:grid-cols-2 gap-2.5">
                <Field
                  id="name"
                  placeholder="Il tuo nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Field
                  id="email"
                  type="email"
                  placeholder="La tua email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <textarea
                data-testid="contact-message"
                rows={3}
                aria-label="Il tuo messaggio"
                placeholder="Il tuo messaggio…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-tv-sky/20 border border-tv-green-deep/12 focus:border-tv-green-deep/40 outline-none text-tv-green-deep placeholder:text-tv-green-deep/65 resize-none text-sm transition-colors"
              />
            </div>
            <PrivacyCheckbox
              id="contact-privacy"
              className="mt-3"
              checked={privacy}
              onChange={(e) => { setPrivacy(e.target.checked); setPrivacyError(""); }}
              purpose="rispondere al mio messaggio"
              error={privacyError}
            />
            <button
              type="submit"
              disabled={submitting}
              data-testid="contact-submit"
              className="btn-tv w-full mt-3 px-5 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold inline-flex items-center justify-center gap-2 hover:bg-tv-green-deep/85 transition-colors disabled:opacity-60"
            >
              {submitting ? "Invio…" : <>Invia messaggio <Send size={16} /></>}
            </button>
            <RecaptchaNotice className="mt-2" />
          </form>

        </div>
      </div>
    </section>
  );
};

const Field = ({ id, type = "text", placeholder, value, onChange }) => (
  <input
    data-testid={`contact-${id}`}
    aria-label={placeholder}
    autoComplete={type === "email" ? "email" : id === "name" ? "name" : undefined}
    required
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full px-4 py-3 rounded-2xl bg-tv-sky/20 border border-tv-green-deep/12 focus:border-tv-green-deep/40 outline-none text-tv-green-deep placeholder:text-tv-green-deep/65 text-sm transition-colors"
  />
);

export default Contatti;
