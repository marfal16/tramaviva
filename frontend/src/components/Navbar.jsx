import React, { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#chi-siamo", label: "Chi siamo" },
  { href: "#attivita", label: "Attività" },
  { href: "#eventi", label: "Eventi" },
  { href: "#iscrizione", label: "Iscrizione" },
  { href: "#contatti", label: "Contatti" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => (e) => {
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div
          className={`flex items-center justify-between rounded-full px-4 md:px-6 py-3 backdrop-blur-xl transition-all duration-500 ${
            scrolled
              ? "bg-tv-cream/85 shadow-[0_8px_30px_-10px_rgba(5,47,23,0.25)] border border-tv-green-deep/10"
              : "bg-tv-cream/50 border border-tv-green-deep/5"
          }`}
        >
          <a href="#hero" onClick={scrollTo("#hero")} data-testid="navbar-logo-link">
            <Logo size={36} />
          </a>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={scrollTo(l.href)}
                data-testid={`nav-link-${l.href.replace("#", "")}`}
                className="px-4 py-2 rounded-full text-sm font-semibold text-tv-green-deep/80 hover:text-tv-green-deep hover:bg-tv-mint/40 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#iscrizione"
              onClick={scrollTo("#iscrizione")}
              data-testid="nav-cta-iscrizione"
              className="btn-tv ml-2 px-5 py-2.5 rounded-full text-sm font-bold bg-tv-green-deep text-tv-cream hover:bg-tv-green"
            >
              Unisciti alla trama
            </a>
          </nav>
          <button
            className="md:hidden p-2 rounded-full bg-tv-green-deep text-tv-cream"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            data-testid="nav-mobile-toggle"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <div
            className="md:hidden mt-2 rounded-3xl bg-tv-cream/95 backdrop-blur-xl border border-tv-green-deep/10 p-4 flex flex-col gap-1"
            data-testid="nav-mobile-menu"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={scrollTo(l.href)}
                className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-mint/40"
                data-testid={`nav-mobile-link-${l.href.replace("#", "")}`}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#iscrizione"
              onClick={scrollTo("#iscrizione")}
              className="mt-2 text-center px-4 py-3 rounded-2xl text-base font-bold bg-tv-green-deep text-tv-cream"
              data-testid="nav-mobile-cta"
            >
              Unisciti alla trama
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
