import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Instagram, Mail, Facebook } from "lucide-react";

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
    <div className="relative mx-auto max-w-7xl px-6 md:px-10 py-10 md:py-12">
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-6">
          <div className="inline-block bg-tv-cream rounded-[2rem] p-3 md:p-4">
            <Logo variant="full" size={170} />
          </div>
          <div className="mt-5 font-display font-black text-3xl md:text-5xl leading-[0.95]">
            Intrecciamo<br />
            storie, persone,<br />
            <span className="italic font-light">opportunità.</span>
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">
            Esplora
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm md:text-base">
            {[
              ["/#chi-siamo", "Chi siamo"],
              ["/progetti", "Progetti"],
              ["/#eventi", "Eventi"],
              ["/#contatti", "Contatti"],
            ].map(([h, l]) => (
              <li key={h}>
                <a href={h} className="hover:text-tv-mint transition-colors">{l}</a>
              </li>
            ))}
            <li>
              <Link to="/club-del-libro" className="hover:text-tv-mint transition-colors">
                Club del Libro
              </Link>
            </li>
            <li>
              <Link to="/cineforum" className="hover:text-tv-mint transition-colors">
                Cineforum
              </Link>
            </li>
            <li>
              <Link to="/area-soci" className="hover:text-tv-mint transition-colors">
                Area soci
              </Link>
            </li>
            <li>
              <Link to="/donazioni" className="hover:text-tv-mint transition-colors">
                Dona
              </Link>
            </li>
            <li>
              <a href="/#iscrizione" className="hover:text-tv-mint transition-colors">
                Diventa socio
              </a>
            </li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">
            Seguici
          </div>
          <div className="space-y-3">
            <a
              href="https://www.instagram.com/tramavivaaps/"
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              data-testid="footer-instagram"
              className="flex items-center gap-2 hover:text-tv-mint transition-colors"
            >
              <Instagram size={18} /> @tramavivaaps
            </a>

          {/* Facebook */}
              <a
                href="https://www.facebook.com/share/1DfEqcoruN/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                data-testid="footer-facebook"
                className="flex items-center gap-2 hover:text-tv-mint transition-colors text-sm"
              >
                <Facebook size={18} /> Trama Viva APS
              </a>
          
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@tramavivaaps"
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                data-testid="footer-tiktok"
                className="flex items-center gap-2 hover:text-tv-mint transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg> 
                @tramavivaaps
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

      {/* Dati ufficiali dell'associazione */}
      <div className="mt-8 pt-6 border-t border-tv-cream/15">
        <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-3">
          Informazioni associative
        </div>

        <div className="space-y-1 text-sm opacity-80">
          <p>
            <span className="font-bold">TRAMA VIVA APS</span> · Associazione di Promozione Sociale senza scopo di lucro
          </p>
          <p>
            Sede legale: Via Pastrengo 36, 80042 Boscotrecase (NA) · C.F. 90117290636
          </p>
          <p>
            Iscritta al RUNTS, sezione APS, rep. n. 181646
          </p>
        </div>
      </div>

      <nav aria-label="Informazioni legali" className="mt-8 pt-5 border-t border-tv-cream/15 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link to="/privacy-policy" className="underline underline-offset-2 hover:text-tv-mint transition-colors">Privacy Policy</Link>
        <Link to="/cookie-policy" className="underline underline-offset-2 hover:text-tv-mint transition-colors">Cookie Policy</Link>
        <Link to="/condizioni" className="underline underline-offset-2 hover:text-tv-mint transition-colors">Condizioni di iscrizione e rimborso</Link>
        <Link to="/accessibilita" className="underline underline-offset-2 hover:text-tv-mint transition-colors">Accessibilità</Link>
      </nav>

      {/* Attribuzione richiesta dai termini d'uso dell'API TMDB (locandine film del Cineforum) */}
      <div className="mt-5 pt-5 border-t border-tv-cream/15 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className="inline-block self-start bg-tv-cream rounded-lg px-3 py-2 shrink-0"
        >
          <img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width="140" height="10" style={{ width: 140, height: "auto" }} className="block" />
          <span className="sr-only"> (si apre in una nuova scheda)</span>
        </a>
        <p className="opacity-80 leading-relaxed">
          <span lang="en">This product uses the TMDB API but is not endorsed or certified by TMDB.</span>{" "}
          (Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB.){" "}
          Copertine e locandine appartengono ai rispettivi titolari e sono mostrate a scopo illustrativo: per segnalazioni o richieste di rimozione scrivi a{" "}
          <a href="mailto:tramavivaaps@gmail.com" className="underline underline-offset-2 hover:text-tv-mint transition-colors">tramavivaaps@gmail.com</a>.
        </p>
      </div>

      <div className="mt-5 pt-5 border-t border-tv-cream/15 flex flex-col md:flex-row justify-between gap-2 md:gap-4 text-xs">
        <div>© {new Date().getFullYear()} APS Trama Viva — Ogni filo conta.</div>
        <div>Fatto con cura, amore e qualche caffè.</div>
      </div>
    </div>
  </footer>
);

export default Footer;
