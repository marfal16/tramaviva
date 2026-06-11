import React from "react";
import { X, AlertCircle } from "lucide-react";

const ConsentModal = ({ onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-tv-bordeaux text-tv-cream p-6 md:p-8 flex items-center justify-between border-b border-tv-bordeaux/20">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} />
            <h2 className="font-display font-bold text-2xl">Condizioni di Iscrizione</h2>
          </div>
          <button
            onClick={onDecline}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6 text-tv-green-deep">
          {/* Sezione Informativa */}
          <section>
            <h3 className="font-bold text-lg mb-3">1. Informativa sul Trattamento dei Dati</h3>
            <p className="text-sm leading-relaxed text-tv-green-deep/80 mb-3">
              Ai sensi dell'art. 13 e 14 del GDPR (Regolamento UE 2016/679), ti informiamo che i dati personali da te forniti saranno trattati da Trama Viva APS per:
            </p>
            <ul className="text-sm space-y-2 ml-4 text-tv-green-deep/80">
              <li>✓ Gestire la tua iscrizione come socio</li>
              <li>✓ Adempiere agli obblighi legali e statutari</li>
              <li>✓ Comunicazioni relative ai servizi offerti</li>
              <li>✓ Invio di newsletter e comunicazioni promozionali (se consentito)</li>
              <li>✓ Compilazione e gestione della documentazione associativa</li>
            </ul>
          </section>

          {/* Sezione Consensi Specifici */}
          <section className="bg-tv-sky/20 p-4 rounded-xl border border-tv-sky/30">
            <h3 className="font-bold text-lg mb-4">2. Consensi Specifici</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="text-tv-bordeaux font-bold mt-1">a)</div>
                <div>
                  <p className="font-bold">Comunicazioni Promozionali</p>
                  <p className="text-tv-green-deep/70 text-xs mt-1">
                    Intendo ricevere comunicazioni promozionali, aggiornamenti su eventi e newsletter da parte di Trama Viva APS via email e SMS.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-tv-bordeaux font-bold mt-1">b)</div>
                <div>
                  <p className="font-bold">Pubblicazione di Dati Pubblici</p>
                  <p className="text-tv-green-deep/70 text-xs mt-1">
                    Autorizzo Trama Viva APS a pubblicare il mio nome, cognome e foto (se fornita) sul sito web e sui canali social ufficiali per promozione di eventi e attività.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-tv-bordeaux font-bold mt-1">c)</div>
                <div>
                  <p className="font-bold">Privacy e Protezione Dati</p>
                  <p className="text-tv-green-deep/70 text-xs mt-1">
                    Ho letto e accetto l'informativa sulla privacy disponibile sul sito. I miei dati saranno protetti secondo la normativa vigente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-tv-bordeaux font-bold mt-1">d)</div>
                <div>
                  <p className="font-bold">Trattamento Dati Personali</p>
                  <p className="text-tv-green-deep/70 text-xs mt-1">
                    Consenso al trattamento dei miei dati personali per la gestione della membership, le comunicazioni necessarie e gli scopi indicati in questa informativa.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sezione Dichiarazione */}
          <section className="bg-tv-green/10 p-4 rounded-xl border border-tv-green/20">
            <h3 className="font-bold text-lg mb-3">3. Dichiarazione del Richiedente</h3>
            <p className="text-sm leading-relaxed text-tv-green-deep/80 mb-3">
              Io sottoscritto/a, con la presente:
            </p>
            <ul className="text-sm space-y-2 ml-4 text-tv-green-deep/80">
              <li>✓ Dichiaro di avere consapevolezza dei rischi e delle responsabilità connesse all'adesione;</li>
              <li>✓ Accetto pienamente lo Statuto e il Regolamento interno di Trama Viva APS;</li>
              <li>✓ Mi impegno a rispettare i valori e i principi dell'associazione;</li>
              <li>✓ Dichiaro di non avere conflitti di interesse incompatibili con l'attività dell'associazione;</li>
              <li>✓ Autorizzo il trattamento dei dati personali secondo quanto dichiarato;</li>
              <li>✓ Prendo visione della documentazione allegata (PDF con tutte le condizioni).</li>
            </ul>
          </section>

          {/* Note Importanti */}
          <div className="bg-tv-bordeaux/10 p-4 rounded-xl border border-tv-bordeaux/20">
            <p className="text-xs text-tv-bordeaux/80 leading-relaxed">
              <strong>Nota:</strong> La tua iscrizione sarà ultimata non appena ci incontreremo per procedere con la firma ufficiale del documento. Nel frattempo, riceverai un'email di conferma con i dettagli della registrazione e le informazioni per il completamento del processo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-tv-cream border-t border-tv-green-deep/10 p-6 md:p-8 flex gap-3 justify-end">
          <button
            onClick={onDecline}
            className="px-6 py-3 rounded-full bg-tv-green-deep/20 text-tv-green-deep font-bold hover:bg-tv-green-deep/30 transition-colors"
          >
            Rifiuta
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold hover:bg-tv-green-deep/90 transition-colors flex items-center gap-2"
          >
            ✓ Accetto le Condizioni
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;