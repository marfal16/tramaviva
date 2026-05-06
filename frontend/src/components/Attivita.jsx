import React from "react";
import { Wine, Mountain, Stethoscope, Laptop } from "lucide-react";

const activities = [
  {
    icon: Wine,
    title: "Aperitivi",
    tag: "Il pretesto migliore",
    desc: "Spritz, tagliere e sconosciuti che diventano amici. Ogni volta un tema diverso, con la stessa energia.",
    bg: "bg-tv-green",
    text: "text-tv-cream",
    col: "md:col-span-5 md:row-span-2",
  },
  {
    icon: Mountain,
    title: "Passeggiate di Gruppo",
    tag: "Camminare & chiacchierare",
    desc: "Parchi, sentieri urbani, trekking brevi. Si parla meglio quando si cammina.",
    bg: "bg-tv-mint",
    col: "md:col-span-4",
  },
  {
    icon: Stethoscope,
    title: "Screening Salute",
    tag: "Prevenire è intrecciare",
    desc: "Giornate con medici volontari. Controlli gratuiti senza file infinite.",
    bg: "bg-tv-orange",
    col: "md:col-span-3 md:row-span-2",
  },
  {
    icon: Laptop,
    title: "Corsi Informatici",
    tag: "Zero paura del click",
    desc: "Per chi vuole capire, senza sentirsi dire 'ma come, non lo sai?'",
    bg: "bg-tv-sky",
    text: "text-tv-cream",
    col: "md:col-span-4",
  },
];

export const Attivita = () => (
  <section
    id="attivita"
    data-testid="attivita-section"
    className="relative py-24 md:py-32 bg-tv-green-deep overflow-hidden"
  >
    <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
      <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="none">
        <g stroke="#F9ECD4" strokeWidth="1" fill="none">
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={i} x1="0" y1={i * 36} x2="800" y2={i * 36 - 60} />
          ))}
        </g>
      </svg>
    </div>
    <div className="relative mx-auto max-w-7xl px-6 md:px-10">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-orange mb-4">
            ② Cosa facciamo
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-cream">
            Quattro modi per<br />
            <span className="italic font-light text-tv-mint">smetterla di scrollare</span>.
          </h2>
        </div>
        <div className="max-w-sm text-tv-cream/70 text-base">
          Le nostre attività variano, ma la trama resta: farti incontrare persone
          vere, fuori dallo schermo.
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-4 md:gap-6 auto-rows-[180px] md:auto-rows-[220px]">
        {activities.map((a, i) => (
          <div
            key={a.title}
            data-testid={`activity-card-${i}`}
            className={`${a.bg} ${a.text || "text-tv-green-deep"} ${a.col} rounded-[2rem] p-7 md:p-8 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 hover:rotate-[-1deg] relative overflow-hidden group`}
          >
            <div className="flex items-center justify-between">
              <a.icon size={32} strokeWidth={2.2} />
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                {a.tag}
              </span>
            </div>
            <div>
              <div className="font-display font-black text-2xl md:text-3xl leading-tight">
                {a.title}
              </div>
              <div className="mt-2 text-sm md:text-base opacity-90 leading-snug">
                {a.desc}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 opacity-10 transition-transform duration-500 group-hover:scale-125">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <g stroke="currentColor" strokeWidth="1" fill="none">
                  <line x1="50" y1="0" x2="50" y2="100" />
                  <line x1="0" y1="50" x2="100" y2="50" />
                  <line x1="14" y1="14" x2="86" y2="86" />
                  <line x1="86" y1="14" x2="14" y2="86" />
                  <circle cx="50" cy="50" r="20" />
                  <circle cx="50" cy="50" r="35" />
                </g>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Attivita;
