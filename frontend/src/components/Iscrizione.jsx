import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const REASONS = [
  {
    emoji: "☀️",
    title: "Un antidoto all'algoritmo",
    desc: "Siamo tutti chiusi nelle nostre bolle digitali. Qui incontri persone, storie e punti di vista che lo schermo del tuo telefono non ti mostrerebbe mai.",
  },
  {
    emoji: "🌱",
    title: "Spazio ai tuoi progetti",
    desc: "Hai un'idea nel cassetto? Questo è uno spazio sicuro per testarla, sporcarti le mani e sperimentare, senza l'ansia di dover fare centro a tutti i costi.",
  },
  {
    emoji: "🗺️",
    title: "Micro-avventure fuori rotta",
    desc: "Dai laboratori insoliti alle camminate curiose. Ogni attività è un pretesto per uscire dalla solita routine e guardare il territorio con occhi diversi.",
  },
];

export const Iscrizione = () => {
  return (
    <section
      id="iscrizione"
      data-testid="iscrizione-section"
      className="relative py-24 md:py-32 bg-tv-sky/50 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">

        {/* Header centrato */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            Diventa socio
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            C'è un filo che aspetta<br />
            <span className="italic font-light text-tv-bordeaux">solo te.</span>
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/70 leading-relaxed">
            Trama Viva non è un'associazione da tessera nel cassetto. 
            È una comunità che si muove, che propone, che si prende cura. 
            Entra, e aggiungi il tuo filo alla trama.
          </p>
        </div>

        {/* Motivazioni */}
        <div className="mb-14">
          {/* Mobile: lista verticale */}
          <div className="flex flex-col gap-7 md:hidden">
            {REASONS.map(({ emoji, title, desc }) => (
              <div key={title} className="flex items-start gap-5">
                <span className="text-4xl leading-none flex-shrink-0">{emoji}</span>
                <div>
                  <div className="font-display font-black text-lg text-tv-green-deep mb-1">{title}</div>
                  <div className="text-sm text-tv-green-deep/70 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: tre colonne centrate senza box */}
          <div className="hidden md:grid md:grid-cols-3 gap-10 text-center">
            {REASONS.map(({ emoji, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <span className="text-5xl">{emoji}</span>
                <div className="font-display font-black text-xl text-tv-green-deep">{title}</div>
                <div className="text-sm text-tv-green-deep/70 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA centrato */}
        <div className="text-center">
          <Link
            to="/iscrizione"
            className="btn-tv inline-flex items-center gap-2 px-8 py-5 rounded-full bg-tv-green-deep text-tv-cream font-bold text-lg hover:bg-tv-green transition-colors"
          >
            Voglio far parte della trama <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-sm text-tv-green-deep/50">
            Ci vogliono 5 minuti. Il resto viene da sé.
          </p>
          <p className="mt-2 text-xs text-tv-green-deep/40">
            Quota annuale: 15 € · Il tesseramento ha validità un anno solare.
          </p>
        </div>

      </div>
    </section>
  );
};

export default Iscrizione;
