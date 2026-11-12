import React, { useEffect, useRef, useState } from "react";
import { Cookie } from "lucide-react";
import { applyConsent, getConsent, OPEN_EVENT, saveConsent } from "../lib/consent";

// Banner cookie: "Rifiuta" e "Accetta" hanno lo stesso peso visivo. Senza scelta le statistiche restano spente.
export const CookieBanner = () => {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const consent = getConsent();
    if (consent) applyConsent(consent);
    else setOpen(true);
    const reopen = () => {
      setAnalytics(!!getConsent()?.analytics);
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  // Porta il focus sul banner quando compare, così chi usa uno screen reader lo trova subito.
  useEffect(() => {
    if (open) boxRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const choose = (value, action) => {
    saveConsent(value, action);
    setOpen(false);
    setCustomize(false);
  };

  const btn = "px-5 py-2.5 rounded-full text-sm font-bold border-2 border-tv-green-deep transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-green-deep";

  return (
    <div
      ref={boxRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      data-testid="cookie-banner"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-3xl border border-tv-green-deep/20 bg-white p-5 shadow-[0_12px_48px_-8px_rgba(5,47,23,0.35)] outline-none md:p-6"
    >
      <div className="flex items-start gap-3">
        <Cookie size={22} className="mt-0.5 shrink-0 text-tv-bordeaux" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="cookie-banner-title" className="font-display text-lg font-black text-tv-green-deep">
            Cookie e privacy
          </h2>
          <p id="cookie-banner-desc" className="mt-1 text-sm leading-relaxed text-tv-green-deep/85">
            Usiamo cookie tecnici, necessari al funzionamento del sito. Con il tuo consenso usiamo anche strumenti
            di statistica anonima (PostHog) per capire come migliorare il sito. Puoi cambiare idea in ogni momento da
            "Gestisci cookie" in fondo alla pagina. Maggiori informazioni nella{" "}
            <a href="/cookie-policy" className="font-bold underline underline-offset-2">Cookie Policy</a> e nella{" "}
            <a href="/privacy-policy" className="font-bold underline underline-offset-2">Privacy Policy</a>.
          </p>

          {customize && (
            <fieldset className="mt-4 space-y-3 rounded-2xl bg-tv-cream/60 p-4">
              <legend className="sr-only">Preferenze cookie</legend>
              <label className="flex items-start gap-3 text-sm text-tv-green-deep">
                <input type="checkbox" checked disabled className="mt-0.5 h-5 w-5 accent-[#2D3A18]" />
                <span>
                  <strong>Tecnici (sempre attivi)</strong>
                  <span className="block text-tv-green-deep/80">Login all'area soci, sicurezza dei form (reCAPTCHA), ricordare questa scelta.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-tv-green-deep">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  data-testid="cookie-analytics"
                  className="mt-0.5 h-5 w-5 accent-[#2D3A18]"
                />
                <span>
                  <strong>Statistiche</strong>
                  <span className="block text-tv-green-deep/80">Misurazione anonima delle visite e registrazione delle sessioni di navigazione (PostHog). I campi dei moduli non vengono mai registrati.</span>
                </span>
              </label>
            </fieldset>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {customize ? (
              <button type="button" onClick={() => choose(analytics, "custom")} data-testid="cookie-save" className={`${btn} bg-tv-green-deep text-tv-cream hover:bg-tv-green-deep/90`}>
                Salva preferenze
              </button>
            ) : (
              <>
                <button type="button" onClick={() => choose(false, "reject_all")} data-testid="cookie-reject" className={`${btn} bg-white text-tv-green-deep hover:bg-tv-green-deep/10`}>
                  Rifiuta
                </button>
                <button type="button" onClick={() => choose(true, "accept_all")} data-testid="cookie-accept" className={`${btn} bg-white text-tv-green-deep hover:bg-tv-green-deep/10`}>
                  Accetta
                </button>
                <button type="button" onClick={() => { setAnalytics(false); setCustomize(true); }} data-testid="cookie-customize" className="px-3 py-2.5 text-sm font-bold text-tv-green-deep underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-green-deep">
                  Personalizza
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
