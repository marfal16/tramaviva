import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Menu, X, User, LogOut, ChevronDown, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";


const links = [
  { href: "#chi-siamo", label: "Chi siamo" },
  { href: "#attivita", label: "Attività" },
  { href: "#eventi", label: "Eventi" },
  { href: "#contatti", label: "Contatti" },
];

const NAVBAR_HEIGHT = 80; // pixel offset for smooth scroll

const API = process.env.REACT_APP_BACKEND_URL;

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClick = e => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => { logout(); navigate("/"); setUserMenuOpen(false); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Handle scroll to anchor when location changes (home page)
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        const offsetTop = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
        setTimeout(() => {
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth"
          });
        }, 50);
      }
    }
  }, [location]);

  // Check if we're on a detail page (not home)
  const isDetailPage = location.pathname !== "/";

  const scrollTo = (href) => (e) => {
    e.preventDefault();
    setOpen(false);

     // If we're on a detail page, navigate back to home first
    if (isDetailPage) {
      window.location.href = "/" + href;
      return;
    }

    // Otherwise, scroll to the anchor on the current page
    const el = document.querySelector(href);
    if (el) {
      const offsetTop = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth"
      });
    }
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
          <a href="/" onClick={scrollTo("#hero")} data-testid="navbar-logo-link">
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
            <Link
              to="/club-del-libro"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-full text-sm font-semibold text-tv-green-deep/80 hover:text-tv-green-deep hover:bg-tv-mint/40 transition-colors"
            >
              Club del Libro
            </Link>
            <Link
              to="/cineforum"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-full text-sm font-semibold text-tv-green-deep/80 hover:text-tv-green-deep hover:bg-tv-sky/20 transition-colors"
            >
              Cineforum
            </Link>
            <Link
              to="/donazioni"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-full text-sm font-semibold text-tv-bordeaux/80 hover:text-tv-bordeaux hover:bg-tv-bordeaux/8 transition-colors flex items-center gap-1.5"
            >
              <Heart size={12} fill="currentColor" /> Dona
            </Link>
            {user ? (
              <div className="relative ml-2" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-tv-green-deep/15 text-tv-green-deep hover:bg-tv-mint/40 transition-colors"
                >
                  {user.has_avatar ? (
                    <img src={`${API}/api/users/${user.id}/avatar`} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-tv-green-deep text-tv-cream flex items-center justify-center text-xs font-black">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold max-w-[100px] truncate">{user.name?.split(" ")[0]}</span>
                  <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-tv-green-deep/10 shadow-lg overflow-hidden z-50">
                    <Link to="/area-soci" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-tv-green-deep hover:bg-tv-mint/30 transition-colors">
                      <User size={14} /> Area soci
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-tv-bordeaux hover:bg-tv-bordeaux/5 transition-colors border-t border-tv-green-deep/8">
                      <LogOut size={14} /> Esci
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="btn-tv ml-2 px-5 py-2.5 rounded-full text-sm font-bold bg-tv-green-deep text-tv-cream hover:bg-tv-green">
                Area soci
              </Link>
            )}
            {!user && (
              <a
                href="#iscrizione"
                onClick={scrollTo("#iscrizione")}
                data-testid="nav-cta-iscrizione"
                className="btn-tv ml-1 px-5 py-2.5 rounded-full text-sm font-bold bg-tv-green-deep text-tv-cream hover:bg-tv-green"
              >
                Diventa socio: unisciti alla trama
              </a>
            )}
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
        <div
            className={`md:hidden mt-2 rounded-3xl bg-tv-cream border border-tv-green-deep/10 p-4 flex flex-col gap-1 transition-all duration-200 origin-top ${
              open ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
            }`}
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
            <Link
              to="/club-del-libro"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-mint/40"
            >
              Club del Libro
            </Link>
            <Link
              to="/cineforum"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-sky/15"
            >
              Cineforum
            </Link>
            <Link
              to="/donazioni"
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-bordeaux hover:bg-tv-bordeaux/8 flex items-center gap-2"
            >
              <Heart size={14} fill="currentColor" /> Dona
            </Link>
            {user ? (
              <>
                <Link to="/area-soci" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-mint/40">
                  <User size={16} /> Area soci
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-semibold text-tv-bordeaux hover:bg-tv-bordeaux/5">
                  <LogOut size={16} /> Esci
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-mint/40">
                  Area soci — Accedi
                </Link>
                <a
                  href="#iscrizione"
                  onClick={scrollTo("#iscrizione")}
                  className="mt-2 text-center px-4 py-3 rounded-2xl text-base font-bold bg-tv-green-deep text-tv-cream"
                  data-testid="nav-mobile-cta"
                >
                  Diventa socio: unisciti alla trama
                </a>
              </>
            )}
          </div>
      </div>
    </header>
  );
};

export default Navbar;
