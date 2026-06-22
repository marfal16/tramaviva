import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Instagram, Mail, Send, Facebook } from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Compila tutti i campi.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/contact`, form);
      toast.success("Messaggio inviato. Grazie!");
      setForm({ name: "", email: "", message: "" });
    } catch (e) {
      toast.error("Errore nell'invio. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contatti"
      data-testid="contatti-section"
      className="relative py-24 md:py-32 bg-tv-sky/30 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">

        {/* Header centrato */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            Scrivici
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Due righe,<br />
            <span className="italic font-light text-tv-bordeaux">un nuovo filo</span>.
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/70 leading-relaxed">
            Hai una proposta? Vuoi collaborare? Vuoi lasciarci un feedback?
            Scrivici qui o trovaci sui nostri canali.
          </p>
        </div>

        {/* Griglia: canali a sinistra, form a destra */}
        <div className="grid md:grid-cols-5 gap-8 items-start max-w-5xl mx-auto">

          {/* Canali */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-tv-green-deep/45 mb-5">
              Trovaci anche qui
            </p>
            <div className="space-y-2">
              {SOCIAL.map(({ icon: Icon, label, value, href, testId }) => (
                <a
                  key={label}
                  href={href}
                  data-testid={testId}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  referrerPolicy={href.startsWith("http") ? "no-referrer" : undefined}
                  className="group flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-tv-green-deep/10 hover:border-tv-green-deep/30 hover:shadow-sm transition-all"
                >
                  <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-tv-sky/50 flex items-center justify-center text-tv-bordeaux group-hover:bg-tv-bordeaux/10 transition-colors">
                    <Icon size={18} />
                  </span>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-tv-green-deep/45">{label}</div>
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
            className="md:col-span-3 bg-white rounded-[2rem] p-7 md:p-9 border border-tv-green-deep/10"
          >
            <div className="font-display font-black text-2xl md:text-3xl text-tv-green-deep leading-tight">
              Scrivici un messaggio.
            </div>
            <div className="mt-1 text-sm text-tv-green-deep/55">
              Rispondiamo in breve tempo, promesso.
            </div>
            <div className="mt-6 space-y-3">
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
              <textarea
                data-testid="contact-message"
                rows={5}
                placeholder="Il tuo messaggio…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl bg-tv-sky/20 border border-tv-green-deep/12 focus:border-tv-green-deep/40 outline-none text-tv-green-deep placeholder:text-tv-green-deep/35 resize-none text-sm transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              data-testid="contact-submit"
              className="btn-tv w-full mt-5 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold inline-flex items-center justify-center gap-2 hover:bg-tv-green transition-colors disabled:opacity-60"
            >
              {submitting ? "Invio…" : <>Invia messaggio <Send size={16} /></>}
            </button>
          </form>

        </div>
      </div>
    </section>
  );
};

const Field = ({ id, type = "text", placeholder, value, onChange }) => (
  <input
    data-testid={`contact-${id}`}
    required
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full px-4 py-3 rounded-2xl bg-tv-sky/20 border border-tv-green-deep/12 focus:border-tv-green-deep/40 outline-none text-tv-green-deep placeholder:text-tv-green-deep/35 text-sm transition-colors"
  />
);

export default Contatti;
