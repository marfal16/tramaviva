import React from "react";
import { RECAPTCHA_SITE_KEY } from "../lib/recaptcha";

// Spunta obbligatoria per il consenso al trattamento dei dati personali, da usare in ogni form che raccoglie dati.
// `purpose` completa la frase: "…acconsento al trattamento dei miei dati personali per {purpose}".
export const PrivacyCheckbox = ({ id = "privacy-consent", checked, onChange, purpose, error, className = "" }) => (
  <div className={className}>
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        required
        checked={!!checked}
        onChange={onChange}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        data-testid={id}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-tv-green-deep/50 accent-[#2D3A18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-green-deep"
      />
      <label htmlFor={id} className="text-sm leading-snug text-tv-green-deep/85 cursor-pointer">
        Ho letto l'
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-bold underline underline-offset-2 hover:text-tv-bordeaux"
        >
          Informativa sulla privacy<span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>{" "}
        e acconsento al trattamento dei miei dati personali per {purpose}. <span aria-hidden="true">*</span>
      </label>
    </div>
    {error && (
      <p id={`${id}-error`} role="alert" className="mt-1.5 ml-8 text-xs font-semibold text-tv-bordeaux">
        {error}
      </p>
    )}
  </div>
);

// Informativa obbligatoria di Google quando il badge reCAPTCHA è nascosto.
export const RecaptchaNotice = ({ className = "" }) => {
  if (!RECAPTCHA_SITE_KEY) return null;
  return (
    <p className={`text-xs leading-snug text-tv-green-deep/75 ${className}`}>
      Questo sito è protetto da reCAPTCHA e si applicano la{" "}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
        Privacy Policy<span className="sr-only"> di Google (si apre in una nuova scheda)</span>
      </a>{" "}
      e i{" "}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
        Termini di servizio<span className="sr-only"> di Google (si apre in una nuova scheda)</span>
      </a>{" "}
      di Google.
    </p>
  );
};

export default PrivacyCheckbox;
