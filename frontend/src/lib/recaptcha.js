// Google reCAPTCHA v3 (invisibile, nessuna sfida da risolvere: più accessibile per chi usa screen reader).
// Se REACT_APP_RECAPTCHA_SITE_KEY non è impostata il controllo è disattivato e i form funzionano come prima.
import { useEffect } from "react";

export const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "";

let loadingPromise = null;

export const loadRecaptcha = () => {
  if (!RECAPTCHA_SITE_KEY || typeof window === "undefined") return Promise.resolve(null);
  if (window.grecaptcha?.execute) return Promise.resolve(window.grecaptcha);
  if (loadingPromise) return loadingPromise;
  loadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    script.async = true;
    script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
    script.onerror = () => { loadingPromise = null; resolve(null); };
    document.head.appendChild(script);
  });
  return loadingPromise;
};

// Restituisce il token per l'azione indicata, oppure "" se reCAPTCHA non è attivo o non raggiungibile.
export const getRecaptchaToken = async (action) => {
  const grecaptcha = await loadRecaptcha();
  if (!grecaptcha) return "";
  try {
    return await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
  } catch {
    return "";
  }
};

// Header da aggiungere alla richiesta: { "X-Recaptcha-Token": "..." } oppure {} se non disponibile.
export const recaptchaHeaders = async (action) => {
  const token = await getRecaptchaToken(action);
  return token ? { "X-Recaptcha-Token": token } : {};
};

// Precarica lo script quando un form protetto viene mostrato.
export const useRecaptcha = () => {
  useEffect(() => { loadRecaptcha(); }, []);
};

// Messaggio da mostrare se il backend rifiuta la richiesta per l'anti-spam.
export const antiSpamMessage = (err) => {
  const detail = err?.response?.data?.detail ?? err?.detail;
  return typeof detail === "string" && detail.toLowerCase().includes("anti-spam") ? detail : null;
};
