import { useEffect, useState } from "react";

// true quando la media query è soddisfatta. Serve a montare un blocco in un solo punto
// della pagina (es. club nell'hero su desktop, sezione a parte su mobile) invece di
// nasconderne una copia col CSS, che farebbe partire due volte le stesse chiamate API.
export function useMediaQuery(query) {
  const get = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange);
    return () => (mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange));
  }, [query]);
  return matches;
}

// Stesso breakpoint "md" di Tailwind
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
