// Strumenti per le foto caricate dall'admin e mostrate sul sito.

// Riduce la foto prima di inviarla (max 1600 px): le foto del telefono sono troppo pesanti per il server.
export const shrinkImage = (file, maxSide = 1600, quality = 0.85) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    resolve(canvas.toDataURL("image/jpeg", quality));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Questo file non si può leggere come foto (usa JPG o PNG).")); };
  img.src = url;
});

// Le foto su Cloudinary si possono chiedere già ridimensionate e compresse: la pagina resta leggera.
// Gli altri indirizzi restano com'erano.
export const cdnThumb = (url, width = 900) => {
  if (typeof url !== "string") return url;
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/);
  return m ? `${m[1]}c_limit,w_${width},q_auto,f_auto/${m[2]}` : url;
};
