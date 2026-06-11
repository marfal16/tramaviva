import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConsentModal from "./ConsentModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initialForm = {
  // Dati personali base
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  referral: "",

  // Dati anagrafici
  luogo_nascita: "",
  data_nascita: "",
  codice_fiscale: "",
  cittadinanza: "",

  // Documento d'identità
  documento_tipo: "Carta ID",
  documento_numero: "",
  documento_rilasciato: "",
  documento_data: "",

  // Residenza e contatti
  indirizzo: "",
  comune: "",
  provincia: "",
  cap: "",
  cellulare: "",

  // Minori
  is_minorenne: false,
  genitore_nome: "",
  genitore_cognome: "",
  genitore_telefono: "",
  genitore_documento_tipo: "Carta ID",
  genitore_documento_numero: "",

  // Consensi
  consenso_comunicazioni: false,
  consenso_pubblico: false,
  consenso_privacy: false,
  consenso_dati: false,

  // Dichiarazione
  dichiarazione_accettata: false,
};

const Field = ({
  id,
  label,
  required,
  type = "text",
  value,
  onChange,
  className = "",
  placeholder = "",
  disabled = false,
}) => (
  <label className={`block ${className}`}>
    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
      {label}
      {required && <span className="text-tv-bordeaux ml-1">*</span>}
    </div>
    <input
      data-testid={`iscrizione-${id}`}
      required={required}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full min-w-0 h-[50px] appearance-none px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep leading-none disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </label>
);

const SelectField = ({
  id,
  label,
  required,
  value,
  onChange,
  options,
  className = "",
}) => (
  <label className={`block ${className}`}>
    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
      {label}
      {required && <span className="text-tv-bordeaux ml-1">*</span>}
    </div>
    <select
      data-testid={`iscrizione-${id}`}
      required={required}
      value={value}
      onChange={onChange}
      className="w-full h-[50px] px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </label>
);

const CheckboxField = ({ id, label, value, onChange, required = false }) => (
  <label className="flex items-center gap-3 py-2 cursor-pointer">
    <input
      data-testid={`iscrizione-${id}`}
      type="checkbox"
      checked={value}
      onChange={onChange}
      required={required}
      className="w-5 h-5 rounded accent-tv-green-deep cursor-pointer"
    />
    <span className="text-sm text-tv-green-deep">
      {label}
      {required && <span className="text-tv-bordeaux ml-1">*</span>}
    </span>
  </label>
);

const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-tv-green-deep/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full py-4 flex items-center justify-between hover:bg-tv-green-deep/5 transition-colors"
      >
        <h4 className="font-bold text-tv-green-deep text-sm uppercase tracking-wider">
          {title}
        </h4>
        {open ? (
          <ChevronUp size={20} className="text-tv-green-deep/60" />
        ) : (
          <ChevronDown size={20} className="text-tv-green-deep/60" />
        )}
      </button>
      {open && <div className="pb-4 space-y-4">{children}</div>}
    </div>
  );
};

export const IscrizioneExpanded = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  const handleChange = (field) => (e) => {
    const { type, checked, value } = e.target;
    setForm({
      ...form,
      [field]: type === "checkbox" ? checked : value,
    });
  };

  const validateForm = () => {
    const required = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "codice_fiscale",
      "comune",
      "indirizzo",
      "cap",
      "cellulare",
      "data_nascita",
    ];

    const missing = required.filter((f) => !form[f]);

    if (missing.length > 0) {
      toast.error(`Compila i campi obbligatori: ${missing.join(", ")}`);
      return false;
    }

    if (!form.dichiarazione_accettata) {
      toast.error("Devi accettare le condizioni.");
      return false;
    }

    const consents = [
      form.consenso_comunicazioni,
      form.consenso_pubblico,
      form.consenso_privacy,
      form.consenso_dati,
    ];

    if (consents.filter((c) => !c).length > 0) {
      toast.error("Devi accettare tutti i consensi.");
      return false;
    }

    if (form.is_minorenne && (!form.genitore_nome || !form.genitore_cognome)) {
      toast.error("Compila i dati del genitore/tutore.");
      return false;
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      // PHASE 1: Salva i dati sul database con il PDF compilato
      toast.info("Salvataggio dati e compilazione PDF...");

      const registrationData = {
        ...form,
        created_at: new Date().toISOString(),
        status: "pending",
      };

      const response = await axios.post(
        `${API}/registrations/create`,
        registrationData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const registrationId = response.data.registration_id;
      toast.success("Dati salvati con successo!");

      // PHASE 2: Crea il checkout di pagamento SumUp
      toast.info("Generazione del link di pagamento...");

      const paymentResponse = await axios.post(
        `${API}/payments/create-checkout`,
        {
          amount: 15.0,
          email: form.email,
          description: `Quota associativa Trama Viva APS - ${form.first_name} ${form.last_name}`,
          registration_id: registrationId,
        }
      );

      const checkoutUrl = paymentResponse.data.checkout_url;

      if (checkoutUrl) {
        toast.success("Anagrafica salvata! Reindirizzamento al pagamento...");
        setForm(initialForm);

        setTimeout(() => {
          window.location.href = checkoutUrl;
        }, 1500);
      } else {
        setDone(true);
        toast.success(
          "Richiesta ricevuta! Completeremo il pagamento in seguito."
        );
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore durante l'iscrizione. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        id="iscrizione"
        data-testid="iscrizione-section"
        className="relative py-24 md:py-32 bg-tv-sky/50"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-12 gap-10">
          {/* Left Column */}
          <div className="md:col-span-5">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
              Diventa socio
            </div>
            <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
              Aggiungi il tuo<br />
              <span className="italic font-light text-tv-bordeaux">filo</span>{" "}
              alla trama.
            </h2>
            <p className="mt-6 text-lg text-tv-green-deep/75 leading-relaxed">
              Iscriverti a Trama Viva significa essere parte di una rete che si
              muove, propone, si incontra.
            </p>

            {/* Info Box */}
            <div className="mt-8 p-6 rounded-2xl bg-tv-green/10 border border-tv-green/20">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="text-tv-bordeaux shrink-0 mt-1"
                />
                <div className="text-sm text-tv-green-deep/80">
                  <p className="font-bold mb-2">Quota associativa: 15,00€</p>
                  <p className="text-xs">
                    Valida un anno solare. Pagabile online tramite carta di
                    credito, PayPal o bonifico.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
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
                <div className="mt-3 opacity-90 text-sm">
                  Abbiamo ricevuto la tua richiesta di iscrizione. Controlla la
                  tua email per confermare il pagamento e i dettagli della tua
                  registrazione.
                </div>
                <p className="mt-4 text-xs opacity-80">
                  La tua iscrizione sarà ultimata non appena ci incontreremo per
                  procedere con la firma del documento.
                </p>
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
                {/* Sezione 1: Dati Personali Base */}
                <CollapsibleSection title="1. Dati Personali" defaultOpen={true}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      id="first_name"
                      label="Nome"
                      required
                      value={form.first_name}
                      onChange={handleChange("first_name")}
                    />
                    <Field
                      id="last_name"
                      label="Cognome"
                      required
                      value={form.last_name}
                      onChange={handleChange("last_name")}
                    />
                    <Field
                      id="email"
                      label="Email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange("email")}
                    />
                    <Field
                      id="phone"
                      label="Telefono"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={handleChange("phone")}
                    />
                  </div>
                </CollapsibleSection>

                {/* Sezione 2: Dati Anagrafici */}
                <CollapsibleSection title="2. Dati Anagrafici">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      id="data_nascita"
                      label="Data di nascita"
                      type="date"
                      required
                      value={form.data_nascita}
                      onChange={handleChange("data_nascita")}
                    />
                    <Field
                      id="luogo_nascita"
                      label="Luogo di nascita"
                      value={form.luogo_nascita}
                      onChange={handleChange("luogo_nascita")}
                    />
                    <Field
                      id="codice_fiscale"
                      label="Codice Fiscale"
                      required
                      value={form.codice_fiscale}
                      onChange={handleChange("codice_fiscale")}
                      placeholder="es. RSSMRA85M01H501U"
                    />
                    <Field
                      id="cittadinanza"
                      label="Cittadinanza"
                      value={form.cittadinanza}
                      onChange={handleChange("cittadinanza")}
                      placeholder="es. Italiana"
                    />
                  </div>
                </CollapsibleSection>

                {/* Sezione 3: Documento d'Identità */}
                <CollapsibleSection title="3. Documento d'Identità">
                  <div className="grid md:grid-cols-2 gap-4">
                    <SelectField
                      id="documento_tipo"
                      label="Tipo di documento"
                      value={form.documento_tipo}
                      onChange={handleChange("documento_tipo")}
                      options={[
                        { value: "Carta ID", label: "Carta d'Identità" },
                        { value: "Passaporto", label: "Passaporto" },
                        { value: "Patente", label: "Patente di Guida" },
                      ]}
                    />
                    <Field
                      id="documento_numero"
                      label="Numero documento"
                      value={form.documento_numero}
                      onChange={handleChange("documento_numero")}
                    />
                    <Field
                      id="documento_rilasciato"
                      label="Rilasciato da"
                      value={form.documento_rilasciato}
                      onChange={handleChange("documento_rilasciato")}
                      placeholder="es. Comune di Milano"
                    />
                    <Field
                      id="documento_data"
                      label="Data rilascio"
                      type="date"
                      value={form.documento_data}
                      onChange={handleChange("documento_data")}
                    />
                  </div>
                </CollapsibleSection>

                {/* Sezione 4: Residenza e Contatti */}
                <CollapsibleSection title="4. Residenza e Contatti">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      id="indirizzo"
                      label="Indirizzo"
                      required
                      value={form.indirizzo}
                      onChange={handleChange("indirizzo")}
                      placeholder="es. Via Roma 123"
                      className="md:col-span-2"
                    />
                    <Field
                      id="comune"
                      label="Comune"
                      required
                      value={form.comune}
                      onChange={handleChange("comune")}
                    />
                    <Field
                      id="provincia"
                      label="Provincia"
                      value={form.provincia}
                      onChange={handleChange("provincia")}
                      placeholder="es. MI"
                    />
                    <Field
                      id="cap"
                      label="CAP"
                      required
                      value={form.cap}
                      onChange={handleChange("cap")}
                      placeholder="es. 20100"
                    />
                    <Field
                      id="cellulare"
                      label="Cellulare"
                      type="tel"
                      required
                      value={form.cellulare}
                      onChange={handleChange("cellulare")}
                    />
                  </div>
                </CollapsibleSection>

                {/* Sezione 5: Minori */}
                <CollapsibleSection title="5. Informazioni Minori">
                  <CheckboxField
                    id="is_minorenne"
                    label="Sono minorenne"
                    value={form.is_minorenne}
                    onChange={handleChange("is_minorenne")}
                  />

                  {form.is_minorenne && (
                    <div className="mt-4 p-4 rounded-xl bg-tv-bordeaux/10 border border-tv-bordeaux/20 space-y-4">
                      <h5 className="font-bold text-tv-bordeaux text-sm">
                        Dati Genitore/Tutore
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Field
                          id="genitore_nome"
                          label="Nome genitore/tutore"
                          required
                          value={form.genitore_nome}
                          onChange={handleChange("genitore_nome")}
                        />
                        <Field
                          id="genitore_cognome"
                          label="Cognome genitore/tutore"
                          required
                          value={form.genitore_cognome}
                          onChange={handleChange("genitore_cognome")}
                        />
                        <Field
                          id="genitore_telefono"
                          label="Telefono genitore/tutore"
                          type="tel"
                          required
                          value={form.genitore_telefono}
                          onChange={handleChange("genitore_telefono")}
                        />
                        <SelectField
                          id="genitore_documento_tipo"
                          label="Documento genitore"
                          value={form.genitore_documento_tipo}
                          onChange={handleChange("genitore_documento_tipo")}
                          options={[
                            { value: "Carta ID", label: "Carta d'Identità" },
                            { value: "Passaporto", label: "Passaporto" },
                            { value: "Patente", label: "Patente di Guida" },
                          ]}
                        />
                        <Field
                          id="genitore_documento_numero"
                          label="Numero documento genitore"
                          value={form.genitore_documento_numero}
                          onChange={handleChange(
                            "genitore_documento_numero"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CollapsibleSection>

                {/* Sezione 6: Consensi */}
                <CollapsibleSection title="6. Consensi e Preferenze">
                  <div className="space-y-3">
                    <CheckboxField
                      id="consenso_comunicazioni"
                      label="Intendo ricevere comunicazioni promozionali e newsletter"
                      value={form.consenso_comunicazioni}
                      onChange={handleChange("consenso_comunicazioni")}
                    />
                    <CheckboxField
                      id="consenso_pubblico"
                      label="Autorizzo a pubblicare il mio evento sul sito"
                      value={form.consenso_pubblico}
                      onChange={handleChange("consenso_pubblico")}
                    />
                    <CheckboxField
                      id="consenso_privacy"
                      label="Ho letto l'informativa sulla privacy"
                      value={form.consenso_privacy}
                      onChange={handleChange("consenso_privacy")}
                    />
                    <CheckboxField
                      id="consenso_dati"
                      label="Consenso al trattamento dei dati personali"
                      value={form.consenso_dati}
                      onChange={handleChange("consenso_dati")}
                    />
                  </div>
                </CollapsibleSection>

                {/* Sezione 7: Dichiarazione Obbligatoria */}
                <CollapsibleSection
                  title="7. Dichiarazione e Accettazione Condizioni"
                  defaultOpen={true}
                >
                  <div className="p-4 rounded-xl bg-tv-bordeaux/5 border border-tv-bordeaux/20">
                    <CheckboxField
                      id="dichiarazione_accettata"
                      label="Ho letto e accetto le informazioni e le condizioni di iscrizione"
                      value={form.dichiarazione_accettata}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setShowConsentModal(true);
                        }
                        handleChange("dichiarazione_accettata")(e);
                      }}
                      required
                    />
                    {!form.dichiarazione_accettata && (
                      <p className="text-xs text-tv-bordeaux mt-2">
                        Campo obbligatorio per procedere
                      </p>
                    )}
                  </div>
                </CollapsibleSection>

                {/* Origine (come ci hai conosciuti) */}
                <div className="mt-6 pt-6 border-t border-tv-green-deep/10">
                  <label className="block">
                    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
                      Come ci hai conosciuti?
                    </div>
                    <input
                      type="text"
                      placeholder="Un amico, Social, Passaparola, Altro..."
                      value={form.referral}
                      onChange={handleChange("referral")}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
                    />
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !form.dichiarazione_accettata}
                  data-testid="iscrizione-submit"
                  className="btn-tv w-full mt-8 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Elaborazione in corso…
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Procedi al Pagamento
                    </>
                  )}
                </button>

                {/* Footer text */}
                <p className="text-xs text-tv-green-deep/60 text-center mt-4">
                  I tuoi dati sono protetti e utilizzati solo per gestire la tua
                  iscrizione.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Consent Modal */}
      {showConsentModal && (
        <ConsentModal
          onAccept={() => setShowConsentModal(false)}
          onDecline={() => {
            setForm({ ...form, dichiarazione_accettata: false });
            setShowConsentModal(false);
          }}
        />
      )}
    </>
  );
};

export default IscrizioneExpanded;
