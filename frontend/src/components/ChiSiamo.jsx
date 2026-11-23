import React from "react";
import { Link } from "react-router-dom";
import { Heart, Users, Compass, Zap, ArrowRight } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Persone prima di tutto",
    body: "Oltre le etichette: un gruppo di amici con la voglia di unire passioni e competenze per rendere possibili incontri e attività sul territorio vesuviano (e non solo).",
    color: "bg-tv-bordeaux",
    text: "text-tv-cream",
    chip: "bg-tv-cream/15",
  },
  {
    icon: Compass,
    title: "In movimento, insieme",
    body: "Qui ci si incontra per davvero: dalle passeggiate in riva al mare alle escursioni in montagna, perché le connessioni migliori nascono camminando insieme.",
    color: "bg-tv-green",
    text: "text-tv-green-deep",
    chip: "bg-tv-green-deep/10",
  },
  {
    icon: Heart,
    title: "Tutto il quartiere invitato",
    body: "Giovani, meno giovani e chi sta nel mezzo: la trama è bella perché ha fili diversi.",
    color: "bg-tv-orange",
    text: "text-tv-green-deep",
    chip: "bg-tv-green-deep/10",
  },
  {
    icon: Zap,
    title: "Seri ma non seriosi",
    body: "Siamo un'Associazione di Promozione Sociale (APS), ma prima di tutto uno spazio umano e accogliente: la leggerezza di una chiacchierata tra amici e sempre un buon motivo per ritrovarsi.",
    color: "bg-tv-sky",
    text: "text-tv-green-deep",
    chip: "bg-tv-green-deep/10",
  },
];

const areas = [
  "Laboratori ed eventi sociali",
  "Club del libro e cineforum",
  "Passeggiate ed escursioni di gruppo",
  "Giornate di prevenzione e screening della salute con medici volontari",
  "Corsi di formazione sulle nuove tecnologie",
];

export const ChiSiamo = () => (
  <section
    id="chi-siamo"
    data-testid="chi-siamo-section"
    className="relative py-12 md:py-16 bg-tv-cream scroll-mt-20"
  >
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      {/* Titolo e punto di partenza */}
      <div className="grid md:grid-cols-12 gap-x-10 gap-y-8 items-end">
        <div className="md:col-span-7">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            Chi siamo
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Un'APS che{" "}
            <span className="italic font-light text-tv-bordeaux">tesse</span>,
            non predica.
          </h2>
        </div>
        <p className="md:col-span-5 text-lg text-tv-green-deep/80 leading-relaxed">
          Siamo partiti da una domanda semplice:{" "}
          <b>perché, da adulti, è diventato così difficile fare nuove amicizie?</b>{" "}
          Da qui è nata Trama Viva: un nome che parla di fili intrecciati, connessioni
          autentiche e qualcosa di vivo, in continuo movimento.
        </p>
      </div>

      {/* Il nostro modo di fare eventi */}
      <div className="mt-10 md:mt-12 border-l-4 border-tv-bordeaux pl-6 md:pl-10 max-w-4xl">
        <p className="text-lg md:text-xl text-tv-green-deep/80 leading-relaxed">
          Non organizziamo eventi per riempire una sala, ma per creare occasioni reali d'incontro.
          Momenti in cui due persone che prima non si conoscevano possano ritrovarsi, a fine serata, a dirsi:
        </p>
        <p className="mt-3 font-display font-black italic text-3xl md:text-4xl leading-tight text-tv-bordeaux">
          «Ci vediamo settimana prossima?»
        </p>
      </div>

      {/* Valori */}
      <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {values.map((v, i) => (
          <div
            key={v.title}
            data-testid={`value-card-${i}`}
            className={`${v.color} ${v.text} rounded-[2rem] p-6 md:p-7 flex flex-col transition-transform duration-500 hover:-translate-y-1.5`}
          >
            <span className={`w-12 h-12 rounded-2xl ${v.chip} flex items-center justify-center`}>
              <v.icon size={26} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-display font-black text-xl md:text-2xl leading-tight">{v.title}</h3>
            <p className="mt-2 text-sm md:text-base leading-snug">{v.body}</p>
          </div>
        ))}
      </div>

      {/* Missione e rimando ai progetti */}
      <div className="mt-10 md:mt-12 bg-tv-green-deep text-tv-cream rounded-[2.5rem] p-8 md:p-12 grid md:grid-cols-12 gap-8 md:gap-12">
        <div className="md:col-span-7">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-tv-orange mb-4">La nostra missione</h3>
          <p className="text-lg md:text-xl leading-relaxed">
            TRAMA VIVA APS è un'associazione di promozione sociale senza scopo di lucro, iscritta al
            Registro Unico Nazionale del Terzo Settore. Promuoviamo la socialità e il contrasto
            all'isolamento nel territorio vesuviano con attività culturali, ricreative e di benessere
            aperte a tutte le età.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/progetti"
              data-testid="chi-siamo-progetti-link"
              className="btn-tv inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-tv-orange text-tv-green-deep hover:bg-tv-orange/85"
            >
              Scopri i nostri progetti <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/iscrizione"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold border border-tv-cream/40 hover:bg-tv-cream/10 transition-colors"
            >
              Diventa socio
            </Link>
          </div>
        </div>
        <div className="md:col-span-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-tv-cream/80 mb-4">Di cosa ci occupiamo</h3>
          <ul className="space-y-3">
            {areas.map((a) => (
              <li key={a} className="flex items-start gap-3 leading-snug">
                <span className="mt-2 w-2 h-2 rounded-full bg-tv-orange shrink-0" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default ChiSiamo;
