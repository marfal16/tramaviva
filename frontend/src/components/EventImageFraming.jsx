import React, { useRef } from "react";
import { Trash2 } from "lucide-react";
import { eventImgStyle, eventImgFit } from "../lib/eventImage";

const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));

/**
 * Inquadratura della locandina: l'admin sceglie quale parte mostrare quando il sito la deve tagliare,
 * oppure di mostrarla intera. Le anteprime usano le stesse proporzioni delle schede del sito.
 */
export const EventImageFraming = ({ src, x = 50, y = 50, fit = "cover", onChange, onRemove }) => {
  const boxRef = useRef(null);
  const ev = { image_pos_x: x, image_pos_y: y, image_fit: fit };

  const pick = (e) => {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    onChange({
      image_pos_x: clamp(((e.clientX - r.left) / r.width) * 100),
      image_pos_y: clamp(((e.clientY - r.top) / r.height) * 100),
    });
  };

  const toggle = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
      active ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "bg-white text-tv-green-deep/70 border-tv-green-deep/20 hover:border-tv-green-deep/40"
    }`;

  return (
    <div className="rounded-2xl border border-tv-green-deep/15 bg-white p-3 space-y-3" data-testid="event-image-framing">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70">Locandina e inquadratura</span>
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs font-bold text-tv-bordeaux hover:underline">
          <Trash2 size={12} /> Rimuovi immagine
        </button>
      </div>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Come mostrare la locandina">
        <button type="button" aria-pressed={fit === "cover"} onClick={() => onChange({ image_fit: "cover" })} className={toggle(fit === "cover")}>
          Riempi lo spazio
        </button>
        <button type="button" aria-pressed={fit === "contain"} onClick={() => onChange({ image_fit: "contain" })} className={toggle(fit === "contain")}>
          Mostra tutta la locandina
        </button>
      </div>

      {fit === "cover" ? (
        <>
          <p className="text-xs text-tv-green-deep/60">
            Clicca (o trascina) sulla locandina nel punto più importante, oppure usa i cursori: nelle schede del sito resta visibile quella parte.
          </p>
          <div
            ref={boxRef}
            className="relative inline-block max-w-full cursor-crosshair select-none touch-none"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
            onPointerMove={(e) => { if (e.buttons === 1) pick(e); }}
          >
            <img src={src} alt="Locandina intera" draggable={false} className="block max-h-56 w-auto max-w-full rounded-xl" />
            <span
              aria-hidden="true"
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white bg-tv-orange shadow ring-2 ring-tv-green-deep pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-tv-green-deep/70">
              Orizzontale
              <input type="range" min="0" max="100" value={x} onChange={(e) => onChange({ image_pos_x: Number(e.target.value) })} className="w-full accent-[#052F17]" />
            </label>
            <label className="block text-xs font-bold text-tv-green-deep/70">
              Verticale
              <input type="range" min="0" max="100" value={y} onChange={(e) => onChange({ image_pos_y: Number(e.target.value) })} className="w-full accent-[#052F17]" />
            </label>
          </div>
          <button type="button" onClick={() => onChange({ image_pos_x: 50, image_pos_y: 50 })} className="text-xs font-bold text-tv-green-deep/70 underline">
            Rimetti al centro
          </button>
        </>
      ) : (
        <p className="text-xs text-tv-green-deep/60">La locandina si vede sempre per intero, senza tagli (può restare un po' di spazio ai lati).</p>
      )}

      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1.5">Come si vede sul sito</div>
        <div className="flex items-end gap-3 flex-wrap">
          <figure>
            <div className="w-56 aspect-[2.2/1] rounded-xl overflow-hidden border border-tv-green-deep/10">
              <img src={src} alt="" style={eventImgStyle(ev)} className={`w-full h-full ${eventImgFit(ev)}`} />
            </div>
            <figcaption className="mt-1 text-[11px] text-tv-green-deep/60">Scheda e pagina evento</figcaption>
          </figure>
          <figure>
            <div className="w-24 aspect-square rounded-xl overflow-hidden border border-tv-green-deep/10">
              <img src={src} alt="" style={eventImgStyle(ev)} className={`w-full h-full ${eventImgFit(ev)}`} />
            </div>
            <figcaption className="mt-1 text-[11px] text-tv-green-deep/60">Evento in evidenza</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
};

export default EventImageFraming;
