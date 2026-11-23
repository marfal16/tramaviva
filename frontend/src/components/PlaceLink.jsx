import React from "react";

const isHttp = (u) => typeof u === "string" && /^https?:\/\//i.test(u);

// Il luogo di un evento: se c'è il link di Google Maps, il nome del locale diventa cliccabile.
export const PlaceLink = ({ place, url, className = "" }) => {
  if (isHttp(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 decoration-dotted hover:decoration-solid ${className}`}
      >
        {place || "Vedi su Maps"}
        <span className="sr-only"> (apre Google Maps in una nuova scheda)</span>
      </a>
    );
  }
  return <span className={className}>{place}</span>;
};

export default PlaceLink;
