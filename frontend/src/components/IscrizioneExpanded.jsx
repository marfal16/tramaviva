import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  CheckCircle2, CreditCard, AlertCircle, ChevronDown, ChevronUp,
  Copy, ExternalLink, Banknote, Landmark, Smartphone,
} from "lucide-react";
import ConsentModal from "./ConsentModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IBAN = "IT48E3688801600100000059432";
const STATUTO_URL = "/statuto-trama-viva.pdf"; // aggiorna con il path reale

const initialForm = {
  first_name: "", last_name: "", email: "", phone: "", referral: "",
  luogo_nascita: "", data_nascita: "", codice_fiscale: "", cittadinanza: "",
  documento_tipo: "Carta ID", documento_numero: "", documento_rilasciato: "", documento_data: "",
  indirizzo: "", comune: "", provincia: "", cap: "", cellulare: "",
  is_minorenne: false,
  genitore_nome: "", genitore_cognome: "", genitore_luogo_nascita: "",
  genitore_data_nascita: "", genitore_codice_fiscale: "", genitore_telefono: "",
  genitore_documento_tipo: "Carta ID", genitore_documento_numero: "",
  consenso_comunicazioni: false,
  consenso_pubblico: false,
  consenso_telefono: false,
  consenso_chat: false,
  consenso_privacy: false,
  consenso_dati: false,
  dichiarazione_accettata: false,
  metodo_pagamento: "",
};

// ─── Field components ────────────────────────────────────────────────────────

const Field = ({ id, label, required, type = "text", value, onChange, placeholder = "", className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/60 mb-1.5">
      {label}{required && <span className="text-tv-bordeaux ml-1">*</span>}
    </label>
    <input
      data-testid={`iscrizione-${id}`}
      required={required} type={type} value={value} onChange={onChange}
      placeholder={placeholder}
      className="w-full h-[50px] px-4 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep appearance-none"
    />
  </div>
);

const SelectField = ({ id, label, required, value, onChange, options, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/60 mb-1.5">
      {label}{required && <span className="text-tv-bordeaux ml-1">*</span>}
    </label>
    <select
      data-testid={`iscrizione-${id}`} required={required} value={value} onChange={onChange}
      className="w-full h-[50px] px-4 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const CheckboxField = ({ id, label, value, onChange, required = false, linkHref, linkLabel }) => (
  <label className="flex items-start gap-3 py-2 cursor-pointer">
    <input
      data-testid={`iscrizione-${id}`} type="checkbox" checked={value} onChange={onChange}
      required={required}
      className="w-5 h-5 mt-0.5 rounded accent-tv-green-deep cursor-pointer shrink-0"
    />
    <span className="text-sm text-tv-green-deep/80 leading-relaxed">
      {label}
      {required && <span className="text-tv-bordeaux ml-1">*</span>}
      {linkHref && (
        <a href={linkHref} target="_blank" rel="noopener noreferrer"
          className="ml-1 text-tv-bordeaux underline inline-flex items-center gap-0.5">
          {linkLabel} <ExternalLink size={11} />
        </a>
      )}
    </span>
  </label>
);

const Section = ({ step, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-tv-green-deep/10 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-tv-sky/20 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-tv-green-deep text-tv-cream text-xs font-black flex items-center justify-center shrink-0">
            {step}
          </span>
          <span className="font-bold text-tv-green-deep text-sm uppercase tracking-wider">{title}</span>
        </div>
        {open ? <ChevronUp size={18} className="text-tv-green-deep/50" /> : <ChevronDown size={18} className="text-tv-green-deep/50" />}
      </button>
      {open && <div className="px-5 pb-5 pt-4 bg-tv-cream/50 space-y-4">{children}</div>}
    </div>
  );
};

// ─── Bonifico info box ────────────────────────────────────────────────────────

const BonificoBox = ({ firstName, lastName }) => {
  const causale = `Quota associativa annuale 2026 - ${firstName} ${lastName}`.trim();
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiato!");
  };
  return (
    <div className="mt-4 p-5 rounded-2xl bg-tv-sky/40 border border-tv-green-deep/15 space-y-3 text-sm">
      <div className="font-bold text-tv-green-deep flex items-center gap-2">
        <Landmark size={16} /> Istruzioni per il Bonifico Bancario
      </div>
      <div className="space-y-2">
        {[
          { label: "Intestatario", value: "Trama Viva" },
          { label: "IBAN", value: IBAN, mono: true },
          { label: "Importo", value: "15,00 €" },
          { label: "Causale", value: causale },
        ].map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-tv-green-deep/60 shrink-0">{label}:</span>
            <span className={`font-bold text-tv-green-deep ${mono ? "font-mono text-xs" : ""} text-right`}>{value}</span>
            <button type="button" onClick={() => copy(value)}
              className="shrink-0 p-1.5 rounded-lg bg-white border border-tv-green-deep/15 hover:bg-tv-sky/40 transition-colors">
              <Copy size={13} className="text-tv-green-deep/60" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-tv-green-deep/60 pt-1 border-t border-tv-green-deep/10">
        Dopo il bonifico, invia la ricevuta a{" "}
        <a href="mailto:tramavivaaps@gmail.com" className="underline text-tv-bordeaux">tramavivaaps@gmail.com</a>
      </p>
    </div>
  );
};

// ─── Payment method selector ─────────────────────────────────────────────────

const METODI = [
  { value: "contanti", label: "Contanti", icon: Banknote, desc: "Consegna il modulo e paga di persona" },
  { value: "bonifico", label: "Bonifico", icon: Landmark, desc: "Riceverai le coordinate bancarie" },
  { value: "elettronico", label: "Carta / Online", icon: Smartphone, desc: "Pagamento sicuro via SumUp" },
];

const MetodoPagamento = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-3">
    {METODI.map(({ value: v, label, icon: Icon, desc }) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${
          value === v
            ? "border-tv-green-deep bg-tv-green-deep/5"
            : "border-tv-green-deep/15 bg-white hover:border-tv-green-deep/40"
        }`}>
        <Icon size={22} className={value === v ? "text-tv-green-deep" : "text-tv-green-deep/50"} />
        <span className={`font-bold text-sm ${value === v ? "text-tv-green-deep" : "text-tv-green-deep/70"}`}>{label}</span>
        <span className="text-[10px] text-tv-green-deep/50 leading-tight">{desc}</span>
      </button>
    ))}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const IscrizioneExpanded = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const change = (field) => (e) => {
    const { type, checked, value } = e.target;
    setForm(f => ({ ...f, [field]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const required = ["first_name","last_name","email","phone","luogo_nascita",
      "data_nascita","codice_fiscale","indirizzo","comune","provincia","cap","cellulare"];
    if (required.some(k => !form[k])) {
      toast.error("Compila tutti i campi obbligatori (*).");
      return false;
    }
    if (!form.metodo_pagamento) {
      toast.error("Seleziona un metodo di pagamento.");
      return false;
    }
    if (!form.dichiarazione_accettata) {
      toast.error("Devi accettare le condizioni di iscrizione.");
      return false;
    }
    if (!form.consenso_privacy || !form.consenso_dati) {
      toast.error("Privacy e trattamento dati sono obbligatori.");
      return false;
    }
    if (form.is_minorenne) {
      const pr = ["genitore_nome","genitore_cognome","genitore_luogo_nascita",
        "genitore_data_nascita","genitore_codice_fiscale","genitore_telefono"];
      if (pr.some(k => !form[k])) {
        toast.error("Compila tutti i dati del genitore/tutore.");
        return false;
      }
    }
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      toast.info("Salvataggio dati e compilazione PDF...");
      const response = await axios.post(`${API}/registrations/create`, form, {
        headers: { "Content-Type": "application/json" },
      });
      const registrationId = response.data.registration_id;

      if (form.metodo_pagamento === "elettronico") {
        toast.info("Generazione link di pagamento...");
        const paymentResponse = await axios.post(`${API}/payments/create-checkout`, {
          amount: 15.0,
          email: form.email,
          description: `Quota associativa Trama Viva APS - ${form.first_name} ${form.last_name}`,
          registration_id: registrationId,
        });
        const checkoutUrl = paymentResponse.data.checkout_url;
        if (checkoutUrl) {
          toast.success("Reindirizzamento al pagamento...");
          setForm(initialForm);
          setTimeout(() => { window.location.href = checkoutUrl; }, 1500);
          return;
        }
      }

      setDone(true);
      setForm(initialForm);
    } catch (error) {
      console.error(error);
      toast.error("Errore durante l'iscrizione. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="min-h-screen bg-tv-sky/30 flex items-center justify-center py-24 px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-tv-green flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-tv-cream" />
          </div>
          <h2 className="font-display font-black text-4xl text-tv-green-deep mb-4">
            Domanda ricevuta!
          </h2>
          <p className="text-tv-green-deep/70 text-lg leading-relaxed mb-3">
            La tua richiesta di iscrizione è stata presa in carico.
            {form.metodo_pagamento === "bonifico" && " Ricordati di inviare la ricevuta del bonifico."}
            {form.metodo_pagamento === "contanti" && " Presentati in sede per completare l'iscrizione."}
          </p>
          <p className="text-sm text-tv-green-deep/50">
            Il Consiglio Direttivo esaminerà la tua domanda e ti darà il benvenuto.
          </p>
          <button onClick={() => setDone(false)}
            className="btn-tv mt-8 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold">
            Invia un'altra richiesta
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative py-16 md:py-24 bg-tv-sky/30">
        <div className="mx-auto max-w-3xl px-6">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-3">
              Domanda di iscrizione
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl text-tv-green-deep">
              Entra a far parte<br />
              <span className="italic font-light text-tv-bordeaux">della trama.</span>
            </h1>
            <p className="mt-4 text-tv-green-deep/60 text-sm">
              Compila il modulo — ci vogliono circa 5 minuti.{" "}
              <a href={STATUTO_URL} target="_blank" rel="noopener noreferrer"
                className="text-tv-bordeaux underline inline-flex items-center gap-1">
                Leggi lo Statuto <ExternalLink size={11} />
              </a>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3" data-testid="iscrizione-form">

            {/* 1. Dati personali */}
            <Section step="1" title="Dati Personali" defaultOpen={true}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="first_name" label="Nome" required value={form.first_name} onChange={change("first_name")} />
                <Field id="last_name" label="Cognome" required value={form.last_name} onChange={change("last_name")} />
                <Field id="email" label="Email" type="email" required value={form.email} onChange={change("email")} />
                <Field id="phone" label="Telefono" type="tel" required value={form.phone} onChange={change("phone")} />
              </div>
            </Section>

            {/* 2. Dati anagrafici */}
            <Section step="2" title="Dati Anagrafici">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="data_nascita" label="Data di nascita" type="date" required value={form.data_nascita} onChange={change("data_nascita")} />
                <Field id="luogo_nascita" label="Luogo di nascita" required value={form.luogo_nascita} onChange={change("luogo_nascita")} />
                <Field id="codice_fiscale" label="Codice Fiscale" required value={form.codice_fiscale} onChange={change("codice_fiscale")} placeholder="RSSMRA85M01H501U" />
                <Field id="cittadinanza" label="Cittadinanza" value={form.cittadinanza} onChange={change("cittadinanza")} placeholder="es. Italiana" />
              </div>
            </Section>

            {/* 3. Documento */}
            <Section step="3" title="Documento d'Identità">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField id="documento_tipo" label="Tipo documento" value={form.documento_tipo} onChange={change("documento_tipo")}
                  options={[{value:"Carta ID",label:"Carta d'Identità"},{value:"Passaporto",label:"Passaporto"},{value:"Patente",label:"Patente"}]} />
                <Field id="documento_numero" label="Numero documento" value={form.documento_numero} onChange={change("documento_numero")} />
                <Field id="documento_rilasciato" label="Rilasciato da" value={form.documento_rilasciato} onChange={change("documento_rilasciato")} placeholder="es. Comune di Napoli" />
                <Field id="documento_data" label="Data rilascio" type="date" value={form.documento_data} onChange={change("documento_data")} />
              </div>
            </Section>

            {/* 4. Residenza */}
            <Section step="4" title="Residenza e Contatti">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="indirizzo" label="Indirizzo" required value={form.indirizzo} onChange={change("indirizzo")} placeholder="Via Roma 1" className="sm:col-span-2" />
                <Field id="comune" label="Comune" required value={form.comune} onChange={change("comune")} />
                <Field id="provincia" label="Provincia" required value={form.provincia} onChange={change("provincia")} placeholder="NA" />
                <Field id="cap" label="CAP" required value={form.cap} onChange={change("cap")} placeholder="80100" />
                <Field id="cellulare" label="Cellulare" type="tel" required value={form.cellulare} onChange={change("cellulare")} />
              </div>
            </Section>

            {/* 5. Minori */}
            <Section step="5" title="Richiedente Minorenne">
              <CheckboxField id="is_minorenne" label="Il richiedente è minorenne"
                value={form.is_minorenne} onChange={change("is_minorenne")} />
              {form.is_minorenne && (
                <div className="mt-3 p-4 rounded-xl bg-tv-bordeaux/5 border border-tv-bordeaux/20 space-y-4">
                  <p className="text-xs font-bold text-tv-bordeaux uppercase tracking-wider">Dati Genitore / Tutore</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id="genitore_nome" label="Nome" required={form.is_minorenne} value={form.genitore_nome} onChange={change("genitore_nome")} />
                    <Field id="genitore_cognome" label="Cognome" required={form.is_minorenne} value={form.genitore_cognome} onChange={change("genitore_cognome")} />
                    <Field id="genitore_luogo_nascita" label="Luogo di nascita" required={form.is_minorenne} value={form.genitore_luogo_nascita} onChange={change("genitore_luogo_nascita")} />
                    <Field id="genitore_data_nascita" label="Data di nascita" type="date" required={form.is_minorenne} value={form.genitore_data_nascita} onChange={change("genitore_data_nascita")} />
                    <Field id="genitore_codice_fiscale" label="Codice Fiscale" required={form.is_minorenne} value={form.genitore_codice_fiscale} onChange={change("genitore_codice_fiscale")} />
                    <Field id="genitore_telefono" label="Telefono" type="tel" required={form.is_minorenne} value={form.genitore_telefono} onChange={change("genitore_telefono")} />
                    <SelectField id="genitore_documento_tipo" label="Tipo documento"
                      value={form.genitore_documento_tipo} onChange={change("genitore_documento_tipo")}
                      options={[{value:"Carta ID",label:"Carta d'Identità"},{value:"Passaporto",label:"Passaporto"},{value:"Patente",label:"Patente"}]} />
                    <Field id="genitore_documento_numero" label="Numero documento" value={form.genitore_documento_numero} onChange={change("genitore_documento_numero")} />
                  </div>
                </div>
              )}
            </Section>

            {/* 6. Consensi */}
            <Section step="6" title="Consensi Privacy">
              <p className="text-xs text-tv-green-deep/60 leading-relaxed">
                Ai sensi degli artt. 13 e 14 del Reg. UE 2016/679 (GDPR), il titolare del trattamento è
                Trama Viva APS — tramavivaaps@gmail.com
              </p>
              <div className="space-y-1 pt-1">
                <CheckboxField id="consenso_comunicazioni"
                  label="a) Acconsento all'invio di comunicazioni promozionali sulle iniziative dell'Associazione (newsletter, eventi)"
                  value={form.consenso_comunicazioni} onChange={change("consenso_comunicazioni")} />
                <CheckboxField id="consenso_pubblico"
                  label="b) Acconsento alla pubblicazione di foto/video sui canali social e sul sito dell'Associazione"
                  value={form.consenso_pubblico} onChange={change("consenso_pubblico")} />
                <CheckboxField id="consenso_telefono"
                  label="c) Acconsento alla condivisione del mio recapito telefonico con altri soci per finalità associative"
                  value={form.consenso_telefono} onChange={change("consenso_telefono")} />
                <CheckboxField id="consenso_chat"
                  label="d) Acconsento all'inserimento del mio numero di telefono in chat di gruppo della community"
                  value={form.consenso_chat} onChange={change("consenso_chat")} />
                <div className="border-t border-tv-green-deep/10 pt-3 mt-2 space-y-1">
                  <CheckboxField id="consenso_privacy" required
                    label="Ho letto e accetto l'Informativa sulla Privacy"
                    value={form.consenso_privacy} onChange={change("consenso_privacy")} />
                  <CheckboxField id="consenso_dati" required
                    label="Acconsento al trattamento dei dati personali per le finalità associative"
                    value={form.consenso_dati} onChange={change("consenso_dati")} />
                </div>
              </div>
            </Section>

            {/* 7. Pagamento */}
            <Section step="7" title="Metodo di Pagamento" defaultOpen={true}>
              <p className="text-sm text-tv-green-deep/60 mb-3">
                Quota associativa annuale: <strong className="text-tv-green-deep">15,00 €</strong>
              </p>
              <MetodoPagamento value={form.metodo_pagamento}
                onChange={(v) => setForm(f => ({ ...f, metodo_pagamento: v }))} />
              {form.metodo_pagamento === "bonifico" && (
                <BonificoBox firstName={form.first_name} lastName={form.last_name} />
              )}
              {form.metodo_pagamento === "contanti" && (
                <div className="mt-3 p-4 rounded-xl bg-tv-orange/10 border border-tv-orange/30 text-sm text-tv-green-deep/80">
                  <strong>Pagamento in contanti:</strong> porta il modulo firmato e la quota in sede al momento dell'incontro con il Consiglio Direttivo.
                </div>
              )}
            </Section>

            {/* 8. Dichiarazione */}
            <Section step="8" title="Dichiarazione finale" defaultOpen={true}>
              <div className="p-4 rounded-xl bg-tv-bordeaux/5 border border-tv-bordeaux/20">
                <CheckboxField id="dichiarazione_accettata" required
                  label="Ho letto e accetto le condizioni di iscrizione e lo "
                  value={form.dichiarazione_accettata}
                  linkHref={STATUTO_URL} linkLabel="Statuto dell'Associazione"
                  onChange={(e) => {
                    if (e.target.checked) setShowConsentModal(true);
                    change("dichiarazione_accettata")(e);
                  }} />
              </div>
            </Section>

            {/* Come ci hai conosciuti */}
            <div className="px-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/60 mb-1.5">
                Come ci hai conosciuti?
              </label>
              <input type="text" value={form.referral} onChange={change("referral")}
                placeholder="Un amico, Social, Passaparola..."
                className="w-full h-[50px] px-4 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep" />
            </div>

            {/* Submit */}
            <button type="submit"
              disabled={submitting || !form.dichiarazione_accettata || !form.metodo_pagamento}
              data-testid="iscrizione-submit"
              className="btn-tv w-full py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.01]">
              {submitting ? (
                <><span className="animate-spin">⏳</span> Elaborazione…</>
              ) : form.metodo_pagamento === "elettronico" ? (
                <><CreditCard size={20} /> Procedi al Pagamento</>
              ) : (
                <><CheckCircle2 size={20} /> Invia la domanda</>
              )}
            </button>

            <p className="text-xs text-tv-green-deep/40 text-center pb-4">
              I tuoi dati sono protetti e utilizzati esclusivamente per gestire la tua iscrizione.
            </p>
          </form>
        </div>
      </section>

      {showConsentModal && (
        <ConsentModal
          onAccept={() => setShowConsentModal(false)}
          onDecline={() => {
            setForm(f => ({ ...f, dichiarazione_accettata: false }));
            setShowConsentModal(false);
          }}
        />
      )}
    </>
  );
};

export default IscrizioneExpanded;
