import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const REASONS = [
  {
    emoji: "☀️",
    title: "Un antidoto all'algoritmo",
    desc: "Siamo tutti chiusi nelle nostre bolle digitali. Qui incontri persone, storie e punti di vista che lo schermo non ti mostrerebbe mai.",
  },
  {
    emoji: "🌱",
    title: "Spazio ai tuoi progetti",
    desc: "Hai un'idea nel cassetto? Questo è uno spazio sicuro per testarla e sperimentare, senza l'ansia di dover fare centro a tutti i costi.",
  },
  {
    emoji: "🗺️",
    title: "Micro-avventure fuori rotta",
    desc: "Dai laboratori insoliti alle camminate curiose: ogni attività è un pretesto per uscire dalla routine e guardare il territorio con occhi diversi.",
  },
];

export const Iscrizione = () => {
  return (
    <section
      id="iscrizione"
      data-testid="iscrizione-section"
      className="relative py-10 md:py-12 bg-tv-sky/50 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">

        {/* Header centrato */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-2">
            Diventa socio
          </div>
          <h2 className="font-display font-black text-3xl md:text-4xl lg:text-5xl leading-[0.95] text-tv-green-deep">
            C'è un filo che aspetta{" "}
            <span className="italic font-light text-tv-bordeaux">solo te.</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-tv-green-deep/75 leading-relaxed">
            Trama Viva non è un'associazione da tessera nel cassetto, ma una comunità che si muove,
            propone e si prende cura. Entra, e aggiungi il tuo filo alla trama.
          </p>
        </div>

        {/* Motivazioni */}
        <div className="mb-6">
          {/* Mobile: lista verticale */}
          <div className="flex flex-col gap-4 md:hidden">
            {REASONS.map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-2xl leading-none flex-shrink-0">{emoji}</span>
                <div>
                  <div className="font-display font-black text-base text-tv-green-deep">{title}</div>
                  <div className="text-sm text-tv-green-deep/75 leading-snug">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: tre colonne centrate senza box */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 text-center">
            {REASONS.map(({ emoji, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-1">
                <span className="text-3xl">{emoji}</span>
                <div className="font-display font-black text-lg text-tv-green-deep">{title}</div>
                <div className="text-sm text-tv-green-deep/75 leading-snug">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA: pulsante e informazioni sulla stessa riga */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
          <Link
            to="/iscrizione"
            className="btn-tv inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-base hover:bg-tv-green-deep/85 transition-colors"
          >
            Voglio far parte della trama <ArrowRight size={18} />
          </Link>
          <div className="text-center md:text-left">
            <p className="text-sm text-tv-green-deep/75">
              Ci vogliono 5 minuti. Il resto viene da sé.
            </p>
            <p className="text-xs text-tv-green-deep/75">
              Quota annuale: 15 € · Il tesseramento ha validità un anno solare.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Iscrizione;
