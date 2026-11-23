import React from "react";

// Formattazione minima per i testi scritti dall'admin (descrizioni eventi):
// ***grassetto corsivo***, **grassetto**, *corsivo*. Il resto resta testo semplice,
// quindi niente HTML iniettato: React fa l'escape di tutto.
const TOKEN_RE = /(\*\*\*[^*\n]+?\*\*\*|\*\*[^*\n]+?\*\*|\*[^*\s][^*\n]*?\*)/g;

export const renderInlineFormat = (text) => {
  if (!text) return text;
  return text.split(TOKEN_RE).map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      return <strong key={i}><em>{part.slice(3, -3)}</em></strong>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i} className="font-bold text-tv-green-deep">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};
