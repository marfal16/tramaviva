// Gestione del consenso cookie.
// Cookie/storage tecnici (login, sicurezza, reCAPTCHA) non richiedono consenso.
// Le statistiche (PostHog) vengono caricate SOLO dopo il consenso esplicito e mai nel pannello /admin.
import { PRIVACY_VERSION } from "./legal";

const KEY = "tv_cookie_consent";
export const OPEN_EVENT = "tv:open-cookie-settings";
export const CHANGE_EVENT = "tv:cookie-consent-changed";

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;
const API = process.env.REACT_APP_BACKEND_URL;
// Chiave e server di PostHog (la chiave è pubblica per costruzione). Per usare il server europeo
// si crea un progetto PostHog in regione UE e si impostano su Vercel (frontend) queste due variabili:
//   REACT_APP_POSTHOG_KEY   = chiave 'phc_...' del progetto europeo
//   REACT_APP_POSTHOG_HOST  = https://eu.i.posthog.com
// La chiave è legata alla regione in cui è stato creato il progetto: non si può cambiare solo l'host.
const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY || "phc_xAvL2Iq4tFmANRE7kzbKwaSqp1HJjN7x48s3vr0CMjs";
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || "https://us.i.posthog.com";
// Usato dalla Cookie Policy per dichiarare dove si trovano i server delle statistiche
export const POSTHOG_IN_EU = /^https:\/\/eu\./.test(POSTHOG_HOST);

const newId = () =>
  (window.crypto?.randomUUID?.() ||
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);

export const getConsent = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    // Se i testi delle policy cambiano (nuova versione) il consenso va richiesto di nuovo.
    // Il Garante raccomanda di richiedere di nuovo la scelta dopo almeno 6 mesi.
    const fresh = raw && Date.now() - new Date(raw.ts).getTime() < SIX_MONTHS_MS;
    if (raw && fresh && raw.version === PRIVACY_VERSION && typeof raw.analytics === "boolean") return raw;
  } catch { /* storage non disponibile o dato corrotto */ }
  return null;
};

export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_EVENT));

// ── PostHog (statistiche), caricato dinamicamente ─────────────────────────────
let posthogLoaded = false;

const isAdminPage = () => window.location.pathname.startsWith("/admin");

const loadPostHog = () => {
  if (posthogLoaded || isAdminPage()) return;
  posthogLoaded = true;
  // Snippet ufficiale PostHog (stub + caricamento asincrono di array.js)
  /* eslint-disable */
  !(function (t, e) {
    var o, n, p, r;
    e.__SV ||
      ((window.posthog = e),
      (e._i = []),
      (e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1])),
            (t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            });
        }
        ((p = t.createElement("script")).type = "text/javascript"),
          (p.crossOrigin = "anonymous"),
          (p.async = !0),
          (p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js"),
          (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
        var u = e;
        for (
          void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
            u.people = u.people || [],
            u.toString = function (t) {
              var e = "posthog";
              return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e;
            },
            u.people.toString = function () {
              return u.toString(1) + ".people (stub)";
            },
            o = "init me ws ys ps bs capture je Di ks register register_once register_for_session unregister unregister_for_session Ps getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Es $s createPersonProfile Is opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing Ss debug xs getPageViewId captureTraceFeedback captureTraceMetric".split(" "),
            n = 0;
          n < o.length;
          n++
        )
          g(u, o[n]);
        e._i.push([i, s, a]);
      }),
      (e.__SV = 1));
  })(document, window.posthog || []);
  /* eslint-enable */
  window.posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    session_recording: {
      recordCrossOriginIframes: true,
      capturePerformance: false,
      maskAllInputs: true, // i campi dei form non vengono mai registrati
      maskTextSelector: "*", // anche i testi a schermo (nomi, email, messaggi) vengono oscurati nelle registrazioni
    },
  });
};

const stopPostHog = () => {
  try {
    if (window.posthog?.opt_out_capturing) {
      window.posthog.opt_out_capturing();
      window.posthog.reset?.();
    }
    // Rimuove le tracce locali di PostHog
    Object.keys(localStorage).filter((k) => k.startsWith("ph_") || k.startsWith("__ph")).forEach((k) => localStorage.removeItem(k));
    document.cookie.split(";").map((c) => c.trim().split("=")[0]).filter((n) => n.startsWith("ph_")).forEach((n) => {
      document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch { /* nulla da fare */ }
};

// Applica la scelta salvata: carica le statistiche solo se consentite.
export const applyConsent = (consent = getConsent()) => {
  if (consent?.analytics) {
    if (window.posthog?.opt_in_capturing && posthogLoaded) window.posthog.opt_in_capturing();
    loadPostHog();
  } else {
    // Consenso negato o revocato: spegne PostHog e rimuove anche le tracce lasciate da visite precedenti
    stopPostHog();
  }
};

// Salva la scelta, la registra sul server (prova del consenso) e la applica.
export const saveConsent = (analytics, action) => {
  const previous = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } })();
  const consent = {
    id: previous?.id || newId(),
    version: PRIVACY_VERSION,
    analytics: !!analytics,
    ts: new Date().toISOString(),
  };
  try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch { /* storage non disponibile */ }
  fetch(`${API}/api/consents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consent_id: consent.id,
      analytics: consent.analytics,
      action: action || (consent.analytics ? "accept_all" : "reject_all"),
      policy_version: PRIVACY_VERSION,
    }),
    keepalive: true,
  }).catch(() => {});
  applyConsent(consent);
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return consent;
};
