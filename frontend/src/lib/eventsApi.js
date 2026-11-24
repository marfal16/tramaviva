// Elenco pubblico degli eventi condiviso tra i componenti della stessa pagina.
// Hero ed Eventi stanno entrambi in home: con questa cache fanno una sola chiamata
// all'API invece di due. La risposta resta valida per poco, così navigando si ricarica.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const TTL_MS = 30000;

let cached = null; // { at, promise }

export function fetchEvents() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.promise;
  const promise = fetch(`${BACKEND_URL}/api/events`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });
  cached = { at: Date.now(), promise };
  // In caso di errore non si tiene in cache: il prossimo componente riprova.
  promise.catch(() => {
    if (cached && cached.promise === promise) cached = null;
  });
  return promise;
}
