import React from "react";

/** Decorative intertwined threads used across sections. */
export const ThreadsBg = ({ className = "", opacity = 0.22 }) => (
  <svg
    className={className}
    viewBox="0 0 1200 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <g stroke="#052F17" strokeWidth="1.2" opacity={opacity} fill="none">
      <path className="thread-path" d="M-50 120 C 200 60, 400 240, 700 140 S 1100 40, 1260 180" />
      <path className="thread-path" style={{ animationDelay: "0.3s" }} d="M-50 240 C 240 180, 480 360, 780 260 S 1120 160, 1260 300" />
      <path className="thread-path" style={{ animationDelay: "0.6s" }} d="M-50 380 C 220 340, 460 500, 760 400 S 1120 300, 1260 440" />
      <path className="thread-path" style={{ animationDelay: "0.9s" }} d="M-50 500 C 260 460, 500 620, 800 520 S 1140 420, 1260 560" />
    </g>
  </svg>
);

export default ThreadsBg;
