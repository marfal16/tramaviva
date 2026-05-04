import React from "react";

/**
 * Placeholder logo: ragnatela + ragnetto stilizzato.
 * Sarà sostituito dal logo ufficiale quando caricato.
 */
export const Logo = ({ size = 40, withText = true, textColor = "#052F17" }) => {
  return (
    <div className="flex items-center gap-3" data-testid="tv-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="spider-float"
      >
        {/* Web radials */}
        <g stroke="#551118" strokeWidth="1.5" strokeLinecap="round">
          <line x1="32" y1="4" x2="32" y2="60" />
          <line x1="4" y1="32" x2="60" y2="32" />
          <line x1="12" y1="12" x2="52" y2="52" />
          <line x1="52" y1="12" x2="12" y2="52" />
        </g>
        {/* Web arcs */}
        <g stroke="#551118" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M32 14 Q44 20 50 32" />
          <path d="M50 32 Q44 44 32 50" />
          <path d="M32 50 Q20 44 14 32" />
          <path d="M14 32 Q20 20 32 14" />
          <path d="M32 20 Q40 24 44 32" />
          <path d="M44 32 Q40 40 32 44" />
          <path d="M32 44 Q24 40 20 32" />
          <path d="M20 32 Q24 24 32 20" />
        </g>
        {/* Spider body */}
        <g>
          <circle cx="32" cy="34" r="4" fill="#551118" />
          <circle cx="32" cy="30" r="2.8" fill="#551118" />
          {/* Legs */}
          <g stroke="#551118" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M28 32 L22 28 L20 32" />
            <path d="M28 34 L20 36 L18 40" />
            <path d="M36 32 L42 28 L44 32" />
            <path d="M36 34 L44 36 L46 40" />
          </g>
          {/* Eyes */}
          <circle cx="31" cy="29.5" r="0.6" fill="#F9ECD4" />
          <circle cx="33" cy="29.5" r="0.6" fill="#F9ECD4" />
        </g>
      </svg>
      {withText && (
        <div className="leading-none">
          <div
            className="font-display font-black text-[15px] tracking-tight"
            style={{ color: textColor }}
          >
            APS <span style={{ color: "#5CB176" }}>Trama</span>{" "}
            <span style={{ color: "#551118" }}>Viva</span>
          </div>
          <div
            className="text-[10px] font-medium mt-0.5 opacity-70"
            style={{ color: textColor }}
          >
            Ogni filo conta
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
