import React from "react";
import { Heart, Users, Compass, Zap } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Persone prima di tutto",
    body: "Non ti chiediamo curriculum. Ti chiediamo se stasera hai voglia di una chiacchiera vera.",
    color: "bg-tv-mint",
  },
  {
    icon: Compass,
    title: "Attivi, non attivisti",
    body: "Meno parole, più passi. Camminiamo, ci vediamo, facciamo cose.",
    color: "bg-tv-green",
    text: "text-tv-cream",
  },
  {
    icon: Heart,
    title: "Tutto il quartiere invitato",
    body: "Giovani, meno giovani, persone in mezzo. La trama è bella perché ha fili diversi.",
    color: "bg-tv-orange",
  },
  {
    icon: Zap,
    title: "Seri ma non seriosi",
    body: "Un po' APS, un po' rimpatriata tra amici. Sempre con un motivo per esserci.",
    color: "bg-tv-sky",
    text: "text-tv-cream",
  },
];

export const ChiSiamo = () => (
  <section
    id="chi-siamo"
    data-testid="chi-siamo-section"
    className="relative py-24 md:py-32 bg-tv-cream"
  >
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            ① Chi siamo
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Un'APS che{" "}
            <span className="italic font-light text-tv-bordeaux">tesse</span>,
            non predica.
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/75 leading-relaxed">
            Siamo partiti da una domanda semplice:{" "}
            <b>perché è diventato così difficile farsi un amico da adulti?</b>{" "}
            Da lì è nata Trama Viva — un nome che parla di fili intrecciati e di qualcosa
            di vivo, in movimento.
          </p>
          <p className="mt-4 text-lg text-tv-green-deep/75 leading-relaxed">
            Non organizziamo eventi per riempire una sala. Li organizziamo per far sì che
            due persone che non si conoscono si dicano, alla fine della serata,{" "}
            <i>"ci risentiamo la prossima settimana?"</i>.
          </p>
        </div>

        <div className="md:col-span-7 grid grid-cols-2 gap-4 md:gap-6">
          {values.map((v, i) => (
            <div
              key={v.title}
              data-testid={`value-card-${i}`}
              className={`${v.color} ${v.text || "text-tv-green-deep"} rounded-[2rem] p-6 md:p-7 ${
                i % 2 === 0 ? "md:translate-y-8" : ""
              } transition-transform duration-500 hover:-translate-y-2`}
            >
              <v.icon size={28} strokeWidth={2.2} />
              <div className="mt-5 font-display font-black text-xl md:text-2xl leading-tight">
                {v.title}
              </div>
              <div className="mt-2 text-sm md:text-base opacity-90 leading-snug">
                {v.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ChiSiamo;
