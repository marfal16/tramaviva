import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Instagram, Mail, Send } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
      className="relative py-24 md:py-32 bg-tv-cream"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            ⑤ Scrivici
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Due righe,<br />
            <span className="italic font-light text-tv-bordeaux">un nuovo filo</span>.
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/75">
            Hai una proposta? Vuoi collaborare? Vuoi solo dirci ciao?
            Scrivici qui o sui nostri canali.
          </p>
          <div className="mt-8 space-y-3">
            <a
              href="mailto:tramavivaaps@gmail.com"
              data-testid="contact-email-link"
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-tv-green-deep/10 hover:border-tv-green hover:bg-tv-mint/20 transition-colors"
            >
              <Mail size={20} className="text-tv-bordeaux" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/60">Email</div>
                <div className="font-semibold text-tv-green-deep">tramavivaaps@gmail.com</div>
              </div>
            </a>
            <a
              href="https://www.instagram.com/tramavivaaps/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-instagram-link"
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border border-tv-green-deep/10 hover:border-tv-green hover:bg-tv-mint/20 transition-colors"
            >
              <Instagram size={20} className="text-tv-bordeaux" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/60">Instagram</div>
                <div className="font-semibold text-tv-green-deep">@tramavivaaps</div>
              </div>
            </a>
          </div>
        </div>

        <form
          onSubmit={submit}
          data-testid="contact-form"
          className="bg-tv-green-deep text-tv-cream rounded-[2rem] p-7 md:p-9"
        >
          <div className="font-display font-black text-2xl md:text-3xl leading-tight">
            Dicci tutto.
          </div>
          <div className="mt-1 text-sm opacity-75">Rispondiamo di persona, promesso.</div>
          <div className="mt-6 space-y-3">
            <Field id="name" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field id="email" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <textarea
              data-testid="contact-message"
              rows={5}
              placeholder="Il tuo messaggio"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-tv-cream/10 border border-tv-cream/20 focus:border-tv-mint outline-none text-tv-cream placeholder:text-tv-cream/50 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            data-testid="contact-submit"
            className="btn-tv w-full mt-5 px-5 py-4 rounded-full bg-tv-orange text-tv-green-deep font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? "Invio…" : <>Invia messaggio <Send size={16} /></>}
          </button>
        </form>
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
    className="w-full px-4 py-3 rounded-2xl bg-tv-cream/10 border border-tv-cream/20 focus:border-tv-mint outline-none text-tv-cream placeholder:text-tv-cream/50"
  />
);

export default Contatti;
