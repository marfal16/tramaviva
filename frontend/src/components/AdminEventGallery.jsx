import React, { useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { shrinkImage, cdnThumb } from "../lib/imageTools";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_PHOTOS = 24;

const errorText = (e, fallback) => {
  const d = e?.response?.data?.detail;
  return typeof d === "string" ? d : (e?.message || fallback);
};

/**
 * "Foto dell'evento": le foto scattate durante l'evento.
 * Compaiono nella pagina del progetto che raccoglie la categoria dell'evento, con titolo e data.
 * Le modifiche si salvano subito, senza premere «Salva» dell'evento.
 */
export const EventGalleryEditor = ({ token, eventId, initial = [] }) => {
  const [photos, setPhotos] = useState(initial || []);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const add = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    let current = photos;
    for (const file of files) {
      if (current.length >= MAX_PHOTOS) { toast.error(`Al massimo ${MAX_PHOTOS} foto per evento.`); break; }
      try {
        const dataUrl = await shrinkImage(file);
        const { data } = await axios.post(`${API}/admin/events/${eventId}/gallery`, { image_data: dataUrl }, auth);
        current = data.gallery;
        setPhotos(current);
      } catch (err) {
        toast.error(`${file.name}: ${errorText(err, "foto non caricata")}`);
      }
    }
    setBusy(false);
  };

  const remove = async (url) => {
    if (!window.confirm("Togliere questa foto dall'evento?")) return;
    const next = photos.filter((u) => u !== url);
    try {
      await axios.put(`${API}/admin/events/${eventId}/gallery`, { photos: next }, auth);
      setPhotos(next);
    } catch (err) {
      toast.error(errorText(err, "Foto non rimossa."));
    }
  };

  return (
    <div data-testid="admin-event-gallery">
      <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Foto dell'evento</div>
      <p className="text-xs text-tv-green-deep/60 mb-3">
        Foto scattate durante l'evento: compaiono nella pagina del progetto collegato, con titolo e data dell'evento.
        Si salvano subito. Pubblica solo foto di persone che hanno dato il consenso.
      </p>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {photos.map((u) => (
            <div key={u} className="relative">
              <img src={cdnThumb(u, 300)} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-xl border border-tv-green-deep/10" />
              <button
                type="button"
                onClick={() => remove(u)}
                aria-label="Togli la foto"
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-tv-bordeaux text-white shadow"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={busy || photos.length >= MAX_PHOTOS}
        onClick={() => fileRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-tv-green-deep/20 text-tv-green-deep/70 text-sm font-bold hover:border-tv-green-deep/40 hover:text-tv-green-deep disabled:opacity-50"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
        {busy ? "Carico…" : `Aggiungi foto (${photos.length}/${MAX_PHOTOS})`}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={add} />
    </div>
  );
};

export default EventGalleryEditor;
