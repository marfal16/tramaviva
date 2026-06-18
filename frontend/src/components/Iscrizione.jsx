import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, FileText, CreditCard } from "lucide-react";

export const Iscrizione = () => {
  return (
    <section
      id="iscrizione"
      data-testid="iscrizione-section"
      className="relative py-24 md:py-32 bg-tv-sky/50"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 grid md:grid-cols-12 gap-10 items-center">
        
        {/* Left Column */}
        <div className="md:col-span-6">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-tv-bordeaux mb-4">
            Diventa socio
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[0.95] text-tv-green-deep">
            Aggiungi il tuo<br />
            <span className="italic font-light text-tv-bordeaux">filo</span> alla trama.
          </h2>
          <p className="mt-6 text-lg text-tv-green-deep/75 leading-relaxed">
            Iscriverti a Trama Viva significa essere parte di una rete che si muove, propone, si incontra. La quota annuale è di <b>15,00€</b>.
          </p>
          <Link
            to="/iscrizione"
            className="btn-tv mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold text-lg hover:bg-tv-green transition-colors"
          >
            Iscriviti ora <ArrowRight size={20} />
          </Link>
        </div>

        {/* Right Column — 3 step cards */}
        <div className="md:col-span-6 grid gap-4">
          {[
            {
              icon: FileText,
              title: "Compila il modulo",
              desc: "Inserisci i tuoi dati anagrafici e i consensi richiesti dallo statuto.",
            },
            {
              icon: CreditCard,
              title: "Versa la quota",
              desc: "15,00€ annuali, pagabili online in sicurezza tramite SumUp.",
            },
            {
              icon: Users,
              title: "Entra nella rete",
              desc: "Il Consiglio Direttivo esamina la domanda e ti dà il benvenuto.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 bg-white rounded-3xl p-5 border border-tv-green-deep/10"
            >
              <div className="w-10 h-10 rounded-2xl bg-tv-green/15 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-tv-green-deep" />
              </div>
              <div>
                <div className="font-bold text-tv-green-deep">{title}</div>
                <div className="text-sm text-tv-green-deep/70 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Iscrizione;
