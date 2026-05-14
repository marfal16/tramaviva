import React from "react";

/**
 * Logo component.
 * variant:
 *  - "mark"  → solo ragnetto+ragnatela (per navbar, icone, favicon)
 *  - "full"  → logo completo con testo "Trama Viva -Aps-" (per footer, hero, firma grande)
 *  - "inline"→ mark piccolo + testo custom react (navbar con tagline sotto)
 */
export const Logo = ({ variant = "inline", size = 40, className = "", textColor = "#052F17" }) => {
  if (variant === "full") {
    return (
      <img
        src="/tramaviva-full.jpg"
        alt="APS Trama Viva — Ogni filo conta"
        width={size}
        style={{ width: size, height: "auto" }}
        className={`block ${className}`}
        data-testid="tv-logo-full"
      />
    );
  }

  if (variant === "mark") {
    return (
      <img
        src="/tramaviva-mark.jpg"
        alt="APS Trama Viva"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        className={`block spider-float ${className}`}
        data-testid="tv-logo-mark"
      />
    );
  }

  // inline: mark small + text next to it
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="tv-logo">
      <img
        src="/tramaviva-mark.jpg"
        alt="APS Trama Viva"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        className="block spider-float rounded-lg"
      />
      <div className="leading-none">
        <div
          className="font-display font-black text-[15px] tracking-tight"
          style={{ color: textColor }}
        >
          APS <span style={{ color: "#A7B94C" }}>Trama</span>{" "}
          <span style={{ color: "#5D1723" }}>Viva</span>
        </div>
        <div
          className="text-[10px] font-medium mt-0.5 opacity-70"
          style={{ color: textColor }}
        >
          Ogni filo conta
        </div>
      </div>
    </div>
  );
};

export default Logo;
