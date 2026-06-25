import React from "react";
import { X, FileText } from "lucide-react";

const ConsentModal = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-tv-bordeaux text-tv-cream p-6 md:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <h2 className="font-display font-bold text-2xl">Dichiarazione di Iscrizione</h2>
          </div>
          <button onClick={onDecline} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 text-tv-green-deep">

          {/* Informativa GDPR breve */}
          <section>
            <h3 className="font-bold text-lg mb-2">Informativa sul trattamento dei dati</h3>
            <p className="text-sm leading-relaxed text-tv-green-deep/80">
              Ai sensi dell'art. 13 del GDPR (Reg. UE 2016/679), i dati personali da te forniti saranno
              trattati da <strong>Trama Viva APS</strong> esclusivamente per gestire la tua iscrizione,
              adempiere agli obblighi legali e statutari e fornirti i servizi associativi.
              I tuoi dati non saranno ceduti a terzi senza consenso e potrai esercitare i tuoi diritti
              scrivendo a <strong>tramavivaaps@gmail.com</strong>.
            </p>
          </section>

          {/* Nota sui consensi privacy */}
          <div className="bg-tv-sky/30 p-4 rounded-xl border border-tv-sky/40 text-sm text-tv-green-deep/80">
            <p>
              <strong>I tuoi consensi privacy</strong> (newsletter, pubblicazione foto, condivisione contatti, community)
              sono quelli che hai scelto nella <strong>Sezione 6 — Consensi Privacy</strong> del modulo.
              Puoi tornare indietro e modificarli prima di inviare.
            </p>
          </div>

          {/* Dichiarazione */}
          <section className="bg-tv-green/10 p-5 rounded-xl border border-tv-green/20">
            <h3 className="font-bold text-lg mb-3">Dichiarazione del richiedente</h3>
            <p className="text-sm text-tv-green-deep/80 mb-3">Con la presente dichiarazione:</p>
            <ul className="text-sm space-y-2.5 ml-4 text-tv-green-deep/80">
              <li>✓ Accetto pienamente lo <strong>Statuto</strong> e il Regolamento interno di Trama Viva APS;</li>
              <li>✓ Mi impegno a rispettare i valori e i principi dell'associazione;</li>
              <li>✓ Dichiaro che le informazioni fornite nel modulo sono veritiere e aggiornate;</li>
              <li>✓ Prendo atto che l'iscrizione diventa ufficiale con la <strong>firma del modulo</strong>, che avverrà di persona al primo incontro con l'associazione.</li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-tv-cream border-t border-tv-green-deep/10 p-6 md:p-8 flex gap-3 justify-end">
          <button
            onClick={onDecline}
            className="px-6 py-3 rounded-full bg-tv-green-deep/15 text-tv-green-deep font-bold hover:bg-tv-green-deep/25 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold hover:bg-tv-green-deep/90 transition-colors flex items-center gap-2"
          >
            ✓ Accetto e continuo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
