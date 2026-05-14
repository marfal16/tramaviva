import React from "react";
import { Heart, Users, Compass, Zap } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Persone prima di tutto",
    body: "Qui non contano le etichette: solo la tua voglia di fare rete.",
    color: "bg-tv-mint",
  },
  {
    icon: Compass,
    title: "In movimento, insieme",
    body: "Dove ci si incontra davvero: ci si vede, si cammina, si fanno cose belle insieme.",
    color: "bg-tv-green",
    text: "text-tv-cream",
  },
  {
    icon: Heart,
    title: "Tutto il quartiere invitato",
    body: "Giovani, meno giovani e chi sta nel mezzo: la trama è bella perché ha fili diversi.",
    color: "bg-tv-orange",
  },
  {
    icon: Zap,
    title: "Seri ma non seriosi",
    body: "Siamo un’APS, ma prima di tutto uno spazio umano e accogliente: con la leggerezza di una chiacchierata tra amici e sempre un buon motivo per ritrovarsi.",
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
              Chi siamo
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Un'APS che{" "}
            <span className="italic font-light text-tv-bordeaux">tesse</span>,
            non predica.
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/75 leading-relaxed">
            Siamo partiti da una domanda semplice:{" "}
            <b>perché, da adulti, è diventato così difficile fare nuove amicizie?</b>{" "}
            Da qui è nata Trama Viva: un nome che parla di fili intrecciati, connessioni autentiche e qualcosa di vivo, 
            in continuo movimento.
          </p>
          <p className="mt-4 text-lg text-tv-green-deep/75 leading-relaxed">
            Non organizziamo eventi per riempire una sala, ma per creare occasioni reali d’incontro. 
            Momenti in cui due persone che prima non si conoscevano possano ritrovarsi, a fine serata, a dirsi:{" "}
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
