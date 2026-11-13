import React, { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { cleanupLegacyTracking, dismissNotice, isNoticeDismissed } from "../lib/consent";

// Avviso informativo sui cookie. Il sito usa solo cookie tecnici, quindi non c'è nessuna scelta da fare:
// basta leggere e chiudere. Non blocca la pagina e non sposta il focus.
export const CookieBanner = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    cleanupLegacyTracking();
    if (!isNoticeDismissed()) setOpen(true);
  }, []);

  if (!open) return null;

  const close = () => {
    dismissNotice();
    setOpen(false);
  };

  return (
    <section
      aria-labelledby="cookie-notice-title"
      data-testid="cookie-banner"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-3xl border border-tv-green-deep/20 bg-white p-5 shadow-[0_12px_48px_-8px_rgba(5,47,23,0.35)] md:p-6"
    >
      <div className="flex items-start gap-3">
        <Cookie size={22} className="mt-0.5 shrink-0 text-tv-bordeaux" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="cookie-notice-title" className="font-display text-lg font-black text-tv-green-deep">
            Cookie
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-tv-green-deep/85">
            Questo sito usa solo cookie e strumenti tecnici, necessari al funzionamento e alla sicurezza (ad esempio il login
            all'area soci e la verifica anti-spam reCAPTCHA di Google). Non usiamo cookie di statistica né di pubblicità e non
            tracciamo la tua navigazione. Maggiori informazioni nella{" "}
            <a href="/cookie-policy" className="font-bold underline underline-offset-2">Cookie Policy</a> e nella{" "}
            <a href="/privacy-policy" className="font-bold underline underline-offset-2">Privacy Policy</a>.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={close}
              data-testid="cookie-dismiss"
              className="rounded-full border-2 border-tv-green-deep bg-tv-green-deep px-5 py-2.5 text-sm font-bold text-tv-cream transition-colors hover:bg-tv-green-deep/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-green-deep"
            >
              Ho capito
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CookieBanner;
