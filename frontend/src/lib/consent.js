// Avviso sui cookie.
// Il sito usa solo cookie e storage tecnici (login all'area soci, sicurezza dei moduli con reCAPTCHA, ricordare questo avviso):
// non serve alcun consenso. Non ci sono strumenti di statistica o di pubblicità di terzi.
const NOTICE_KEY = "tv_cookie_notice";

export const isNoticeDismissed = () => {
  try { return localStorage.getItem(NOTICE_KEY) === "1"; } catch { return false; }
};

export const dismissNotice = () => {
  try { localStorage.setItem(NOTICE_KEY, "1"); } catch { /* storage non disponibile */ }
};

// Rimuove dal browser le tracce lasciate in passato dallo strumento di statistica PostHog (non più usato)
// e la vecchia scelta sui cookie, così chi ha visitato il sito prima non si porta dietro dati inutili.
export const cleanupLegacyTracking = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("ph_") || k.startsWith("__ph"))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem("tv_cookie_consent");
    const host = window.location.hostname;
    const root = host.replace(/^www\./, "");
    const domains = [null, host, `.${host}`, `.${root}`];
    document.cookie
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter((n) => n.startsWith("ph_"))
      .forEach((n) => {
        domains.forEach((d) => {
          document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
        });
      });
  } catch { /* nulla da fare */ }
};
