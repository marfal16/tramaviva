import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, ShieldCheck, RefreshCw, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmtDateTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
};

const TRIGGER_LABEL = { cron: "Automatica", admin: "Manuale" };

/**
 * Pannello "Privacy e dati": rende vera la promessa dell'informativa sui tempi di conservazione.
 * - mostra cosa è scaduto e verrebbe cancellato o reso anonimo
 * - lo esegue ogni settimana in automatico (Vercel Cron) oppure al clic di "Esegui ora"
 * - mostra il registro delle scelte cookie
 */
export const PrivacyManager = ({ token }) => {
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [plan, setPlan] = useState(null);
  const [consents, setConsents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        axios.get(`${API}/admin/retention`, auth),
        axios.get(`${API}/admin/consents`, { ...auth, params: { limit: 1 } }),
      ]);
      setPlan(r.data);
      setConsents(c.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Impossibile caricare i dati");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const items = plan ? Object.entries(plan.items) : [];
  const total = items.reduce((sum, [, v]) => sum + v.count, 0);

  const run = async () => {
    if (!window.confirm(
      `Verranno cancellati o resi anonimi ${total} record scaduti. L'operazione non si può annullare. Procedere?`
    )) return;
    setRunning(true);
    try {
      const { data } = await axios.post(`${API}/admin/retention/run`, {}, auth);
      const done = Object.values(data.items).reduce((s, v) => s + v.count, 0);
      toast.success(done ? `Fatto: ${done} record trattati` : "Niente da cancellare");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Operazione non riuscita");
    } finally {
      setRunning(false);
    }
  };

  const card = "bg-white rounded-2xl border border-tv-green-deep/10 p-5 md:p-6";

  return (
    <div className="space-y-6" data-testid="admin-privacy">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-tv-green/20 text-tv-green flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl text-tv-green-deep">Privacy e dati</h2>
            <p className="text-sm text-tv-green-deep/70">Conservazione dei dati personali come promesso nell'informativa.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-tv-green-deep/20 text-sm font-bold text-tv-green-deep hover:bg-tv-green-deep/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" /> Aggiorna
        </button>
      </div>

      {loading && !plan ? (
        <div className="flex items-center gap-2 text-tv-green-deep/70"><Loader2 className="animate-spin" size={18} /> Caricamento…</div>
      ) : plan ? (
        <>
          <div className={card}>
            <h3 className="font-bold text-tv-green-deep mb-1">Pulizia automatica</h3>
            {plan.cron_configured ? (
              <p className="flex items-start gap-2 text-sm text-tv-green-deep/80">
                <CheckCircle2 size={18} className="text-tv-green mt-0.5 shrink-0" aria-hidden="true" />
                Attiva: ogni lunedì notte il sito cancella da solo i dati scaduti elencati qui sotto.
              </p>
            ) : (
              <p className="flex items-start gap-2 text-sm text-tv-bordeaux">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Non ancora attiva.</strong> Su Vercel, nel progetto <em>tramaviva-api</em>, aggiungi la variabile
                  d'ambiente <code className="bg-tv-cream px-1 rounded">CRON_SECRET</code> con una stringa lunga e casuale, poi rifai il deploy.
                  Nel frattempo puoi eseguire la pulizia a mano con il pulsante qui sotto.
                </span>
              </p>
            )}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div>
                <h3 className="font-bold text-tv-green-deep">Dati scaduti in questo momento</h3>
                <p className="text-sm text-tv-green-deep/70">
                  Totale: <strong>{total}</strong> record
                </p>
              </div>
              <button
                type="button"
                onClick={run}
                disabled={running || total === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-bordeaux text-tv-cream text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {running ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
                Esegui ora
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Dati scaduti per categoria</caption>
                <thead>
                  <tr className="text-left text-tv-green-deep/70">
                    <th scope="col" className="py-2 pr-3 font-bold">Categoria</th>
                    <th scope="col" className="py-2 pr-3 font-bold">Cosa succede</th>
                    <th scope="col" className="py-2 font-bold text-right">Record</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(([key, v]) => (
                    <tr key={key} className="border-t border-tv-green-deep/10">
                      <td className="py-2 pr-3">{v.label}</td>
                      <td className="py-2 pr-3 text-tv-green-deep/70">{v.action === "delete" ? "Cancellati" : "Resi anonimi"}</td>
                      <td className={`py-2 text-right font-bold ${v.count ? "text-tv-bordeaux" : "text-tv-green-deep/60"}`}>{v.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-tv-green-deep/70 mt-4">
              «Resi anonimi» significa che nome, email, telefono e messaggi vengono tolti, ma restano importi, date e numero di partecipanti per i conti e le statistiche.
            </p>
          </div>

          {plan.warnings?.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900" role="status">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <ul className="space-y-1">{plan.warnings.map((w) => <li key={w.key}>{w.text}</li>)}</ul>
              </div>
            </div>
          )}

          <div className={card}>
            <h3 className="font-bold text-tv-green-deep mb-3">Ultime pulizie eseguite</h3>
            {plan.last_runs?.length ? (
              <ul className="space-y-2 text-sm">
                {plan.last_runs.map((r) => {
                  const n = Object.values(r.counts || {}).reduce((s, x) => s + x, 0);
                  return (
                    <li key={r.id} className="flex justify-between gap-3 border-t border-tv-green-deep/10 pt-2 first:border-0 first:pt-0">
                      <span>{fmtDateTime(r.run_at)} · {TRIGGER_LABEL[r.trigger] || r.trigger}</span>
                      <span className="font-bold">{n} record</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-tv-green-deep/70">Nessuna pulizia ancora eseguita.</p>
            )}
          </div>

          {consents && (
            <div className={card}>
              <h3 className="font-bold text-tv-green-deep mb-1">Registro delle scelte sui cookie</h3>
              <p className="text-sm text-tv-green-deep/80">
                {consents.total} scelte registrate: {consents.analytics_accepted} con statistiche accettate,{" "}
                {consents.analytics_rejected} rifiutate. Le scelte restano per 5 anni come prova del consenso.
              </p>
            </div>
          )}

          <div className={card}>
            <h3 className="font-bold text-tv-green-deep mb-2">Tempi di conservazione applicati</h3>
            <ul className="text-sm text-tv-green-deep/80 space-y-1 list-disc pl-5">
              <li>Messaggi del form contatti e richieste del modulo breve di adesione: 24 mesi.</li>
              <li>Prenotazioni a eventi: 24 mesi dopo la data dell'evento, poi restano solo importi e conteggi.</li>
              <li>Iscrizioni online mai approvate: 12 mesi. Quelle approvate si chiudono da «Pratica al 100%» nel Registro Soci.</li>
              <li>Donazioni: 10 anni, poi restano solo importi e date.</li>
              <li>Scelte sui cookie: 5 anni.</li>
            </ul>
            <p className="text-xs text-tv-green-deep/70 mt-3">
              Gli stessi tempi sono scritti nell'informativa privacy: se vuoi cambiarli vanno modificati in entrambi i posti.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default PrivacyManager;
