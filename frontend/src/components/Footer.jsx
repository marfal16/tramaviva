import React from "react";
import { Logo } from "./Logo";
import { Instagram, Mail } from "lucide-react";

export const Footer = () => (
  <footer
    data-testid="footer"
    className="relative bg-tv-bordeaux text-tv-cream overflow-hidden"
  >
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <svg viewBox="0 0 1000 400" className="w-full h-full" preserveAspectRatio="none">
        <g stroke="#F9ECD4" strokeWidth="1" fill="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${i * 20} Q 500 ${i * 20 + 50} 1000 ${i * 20}`}
            />
          ))}
        </g>
      </svg>
    </div>
    <div className="relative mx-auto max-w-7xl px-6 md:px-10 py-16 md:py-20">
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-6">
          <div className="inline-block bg-tv-cream rounded-[2rem] p-4 md:p-5">
            <Logo variant="full" size={220} />
          </div>
          <div className="mt-8 font-display font-black text-4xl md:text-6xl leading-[0.95]">
            Intrecciamo<br />
            storie, persone,<br />
            <span className="italic font-light">opportunità.</span>
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">
            Esplora
          </div>
          <ul className="space-y-2">
            {[
              ["#chi-siamo", "Chi siamo"],
              ["#attivita", "Attività"],
              ["#eventi", "Eventi"],
              ["#iscrizione", "Iscrizione"],
              ["#contatti", "Contatti"],
            ].map(([h, l]) => (
              <li key={h}>
                <a
                  href={h}
                  data-testid={`footer-link-${h.replace("#", "")}`}
                  className="hover:text-tv-mint transition-colors"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-3">
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">
            Seguici
          </div>
          <div className="space-y-3">
            <a
              href="https://www.instagram.com/tramavivaaps?igsh=a252bTk2b3F4OTVx&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-instagram"
              className="flex items-center gap-2 hover:text-tv-mint transition-colors"
            >
              <Instagram size={18} /> @tramavivaaps
            </a>
            <a
              href="mailto:tramavivaaps@gmail.com"
              data-testid="footer-email"
              className="flex items-center gap-2 hover:text-tv-mint transition-colors"
            >
              <Mail size={18} /> tramavivaaps@gmail.com
            </a>
          </div>
        </div>
      </div>
      <div className="mt-14 pt-6 border-t border-tv-cream/15 flex flex-col md:flex-row justify-between gap-4 text-xs opacity-70">
        <div>© {new Date().getFullYear()} APS Trama Viva — Ogni filo conta.</div>
        <div>Fatto con cura, caffè e qualche cammino.</div>
      </div>
    </div>
  </footer>
);

export default Footer;
