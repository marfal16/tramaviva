// Accessibilità delle finestre modali del sito pubblico.
//
// Il sito ha molte finestre modali costruite come overlay "fixed inset-0". Invece di ripetere in ogni componente
// la stessa logica, questo modulo osserva il DOM e, quando compare un overlay, lo rende una vera finestra di
// dialogo per tastiera e screen reader:
//   - role="dialog", aria-modal="true" e nome preso dal primo titolo (h1-h3) contenuto;
//   - il focus entra nella finestra e il Tab resta al suo interno (focus trap);
//   - Esc chiude (clic sul pulsante «Chiudi» oppure sull'overlay, come farebbe un utente col mouse);
//   - alla chiusura il focus torna all'elemento che aveva aperto la finestra.
// Non agisce nel pannello /admin né su elementi che hanno già un ruolo (ad es. i componenti Radix).

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const stack = []; // { overlay, opener }
let uid = 0;

const isCandidate = (el) =>
  el.nodeType === 1 &&
  el.classList.contains("fixed") &&
  el.classList.contains("inset-0") &&
  !el.classList.contains("pointer-events-none") &&
  !el.hasAttribute("role") &&
  !el.hasAttribute("aria-hidden") &&
  !el.hasAttribute("data-state") &&
  !el.dataset.a11yModal;

const visibleFocusables = (root) => [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);

const enhance = (overlay) => {
  if (window.location.pathname.startsWith("/admin")) return;
  overlay.dataset.a11yModal = "1";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  const heading = overlay.querySelector("h1,h2,h3");
  if (heading) {
    if (!heading.id) heading.id = `modal-title-${++uid}`;
    overlay.setAttribute("aria-labelledby", heading.id);
  } else {
    overlay.setAttribute("aria-label", "Finestra di dialogo");
  }
  const opener = document.activeElement;
  stack.push({ overlay, opener });
  requestAnimationFrame(() => {
    if (!overlay.isConnected || overlay.contains(document.activeElement)) return;
    const first = visibleFocusables(overlay)[0];
    if (first) first.focus();
    else { overlay.tabIndex = -1; overlay.focus(); }
  });
};

const scan = (node) => {
  if (node.nodeType !== 1) return;
  if (isCandidate(node)) enhance(node);
  node.querySelectorAll?.(".fixed.inset-0").forEach((el) => { if (isCandidate(el)) enhance(el); });
};

const prune = () => {
  let closed = null;
  for (let i = stack.length - 1; i >= 0; i--) {
    if (!stack[i].overlay.isConnected) { closed = stack[i]; stack.splice(i, 1); }
  }
  if (closed && !stack.length && closed.opener?.isConnected) closed.opener.focus?.();
};

const onKeyDown = (e) => {
  const top = stack[stack.length - 1];
  if (!top || !top.overlay.isConnected) return;
  const { overlay } = top;
  if (e.key === "Escape") {
    const closeBtn = overlay.querySelector('[aria-label="Chiudi"], [aria-label="Chiudi finestra"]');
    e.preventDefault();
    (closeBtn || overlay).click();
    return;
  }
  if (e.key !== "Tab") return;
  const items = visibleFocusables(overlay);
  if (!items.length) { e.preventDefault(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (!overlay.contains(active)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
};

export const initModalA11y = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => m.addedNodes.forEach(scan));
    prune();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("keydown", onKeyDown, true);
  scan(document.body);
  return () => {
    observer.disconnect();
    document.removeEventListener("keydown", onKeyDown, true);
  };
};
