// Come mostrare la locandina di un evento: quale parte (inquadratura) e se tagliarla o mostrarla intera.
// Lo usano sia il sito sia l'admin, così le due viste coincidono.

const pct = (v) => {
  if (v === null || v === undefined || v === "") return 50;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
};

// Stile da dare all'immagine: quale parte restare visibile quando l'immagine viene tagliata
export const eventImgStyle = (ev) => ({ objectPosition: `${pct(ev?.image_pos_x)}% ${pct(ev?.image_pos_y)}%` });

// Classi: "riempi lo spazio" (può tagliare) oppure "mostra tutta la locandina" su fondo chiaro
export const eventImgFit = (ev) => (ev?.image_fit === "contain" ? "object-contain bg-tv-green-deep/[0.06]" : "object-cover");
