import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initial = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  birthdate: "",
  motivation: "",
};

export const Iscrizione = () => {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error("Nome, cognome ed email sono obbligatori.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/membership`, form);
      setDone(true);
      toast.success("Richiesta inviata! Ti contattiamo noi.");
      setForm(initial);
    } catch (e) {
      toast.error("Qualcosa è andato storto. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="iscrizione"
      data-testid="iscrizione-section"
      className="relative py-24 md:py-32 bg-tv-mint/50"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
              Diventa socio
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Aggiungi il tuo<br />
            <span className="italic font-light text-tv-bordeaux">filo</span> alla trama.
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/75 leading-relaxed">
            Iscriverti a Trama Viva significa essere parte di una rete che si muove, propone, si incontra. Invia subito la tua{" "}
            <b>richiesta di iscrizione</b>: ti ricontatteremo a breve.
          </p>
          {/*
          <ul className="mt-8 space-y-3 text-tv-green-deep/80">
            {[
              "Accesso prioritario a tutti gli eventi",
              "Proponi le tue attività e iniziative",
              "Tessera associativa",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-tv-green shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          */}
        </div>

        <div className="md:col-span-7">
          {done ? (
            <div
              data-testid="iscrizione-success"
              className="rounded-[2rem] p-10 bg-tv-green text-tv-cream"
            >
              <CheckCircle2 size={40} />
              <div className="mt-5 font-display font-black text-3xl">
                Benvenut* nella trama.
              </div>
              <div className="mt-3 opacity-90">
                Abbiamo ricevuto la tua richiesta. Ti scriviamo a breve per
                organizzare il primo incontro.
              </div>
              <button
                onClick={() => setDone(false)}
                className="btn-tv mt-6 px-5 py-3 rounded-full bg-tv-cream text-tv-green-deep font-bold"
                data-testid="iscrizione-new"
              >
                Invia un'altra richiesta
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="bg-tv-cream rounded-[2rem] p-7 md:p-9 border border-tv-green-deep/10"
              data-testid="iscrizione-form"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Field id="first_name" label="Nome *" required value={form.first_name} onChange={change("first_name")} />
                <Field id="last_name" label="Cognome *" required value={form.last_name} onChange={change("last_name")} />
                <Field id="email" label="Email *" type="email" required value={form.email} onChange={change("email")} />
                <Field id="phone" label="Telefono" value={form.phone} onChange={change("phone")} />
                <Field id="city" label="Città" value={form.city} onChange={change("city")} />
                             <Field 
                  id="birthdate" 
                  label="Data di nascita" 
                  type="date" 
                  value={form.birthdate} 
                  onChange={change("birthdate")} 
                  className="w-full" 
                />
              </div>
              <label className="block mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
                  Perché vuoi unirti a Trama Viva?
                </div>
                <textarea
                  data-testid="iscrizione-motivation"
                  rows={4}
                  placeholder="Due righe bastano. Non ti interroghiamo."
                  value={form.motivation}
                  onChange={change("motivation")}
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep resize-none"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                data-testid="iscrizione-submit"
                className="btn-tv w-full mt-6 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
              >
                {submitting ? "Invio in corso…" : "Invia richiesta di iscrizione"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

const Field = ({ id, label, required, type = "text", value, onChange, className }) => (
  <label className={`block ${className || ""}`}>
    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
      {label}
    </div>
    <input
      data-testid={`iscrizione-${id}`}
      required={required}
      type={type}
      value={value}
      onChange={onChange}
      className="w-full min-w-0 appearance-none px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
    />
  </label>
);

export default Iscrizione;
