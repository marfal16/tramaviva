import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Menu, X, User, LogOut, ChevronDown, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CLUBS_CONFIG } from "../clubsConfig";

const links = [
  { href: "#chi-siamo", label: "Chi siamo" },
  { href: "#attivita", label: "Attività" },
  { href: "#eventi", label: "Eventi" },
];

const CLUBS = CLUBS_CONFIG.map(c => ({ to: c.path, label: c.label, icon: c.icon, color: c.iconColor }));

const NAVBAR_HEIGHT = 80;

const API = process.env.REACT_APP_BACKEND_URL;

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clubsOpen, setClubsOpen] = useState(false);
  const [mobileClubsOpen, setMobileClubsOpen] = useState(false);
  const userMenuRef = useRef();
  const clubsRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClick = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (clubsRef.current && !clubsRef.current.contains(e.target)) setClubsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => { logout(); navigate("/"); setUserMenuOpen(false); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const hash = location.hash;
      const firstMount = isFirstRender.current;
      isFirstRender.current = false;
      const doScroll = () => {
        const el = document.querySelector(hash);
        if (el) {
          const offsetTop = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
          window.scrollTo({ top: offsetTop, behavior: "smooth" });
        }
      };
      if (firstMount) {
        // wait for fonts so layout is stable before computing geometry
        document.fonts.ready.then(doScroll);
      } else {
        setTimeout(doScroll, 50);
      }
    } else {
      isFirstRender.current = false;
    }
  }, [location]);

  useEffect(() => { if (!open) setMobileClubsOpen(false); }, [open]);

  const isDetailPage = location.pathname !== "/";

  const scrollTo = (href) => (e) => {
    e.preventDefault();
    setOpen(false);
    if (isDetailPage) { window.location.href = "/" + href; return; }
    const el = document.querySelector(href);
    if (el) {
      const offsetTop = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  const closeAll = () => { setOpen(false); setClubsOpen(false); setUserMenuOpen(false); };

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-2" : "py-4"}`}
    >
      {/* relative qui perché il menu mobile è absolute rispetto a questo container */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
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

          {/* ── Desktop nav ── */}
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

            {/* Dropdown "I nostri Club" */}
            <div className="relative" ref={clubsRef}>
              <button
                onClick={() => setClubsOpen(o => !o)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  clubsOpen
                    ? "bg-tv-mint/50 text-tv-green-deep"
                    : "text-tv-green-deep/80 hover:text-tv-green-deep hover:bg-tv-mint/40"
                }`}
              >
                I nostri Club
                <ChevronDown size={13} className={`transition-transform duration-200 ${clubsOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`absolute left-0 top-full mt-2 w-48 bg-white rounded-2xl border border-tv-green-deep/10 shadow-lg overflow-hidden z-50 transition-all duration-150 origin-top ${
                  clubsOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
                }`}
              >
                {CLUBS.map(({ to, label, icon: Icon, color }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={closeAll}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-tv-green-deep hover:bg-tv-mint/30 transition-colors first:border-b first:border-tv-green-deep/8"
                  >
                    <Icon size={15} className={color} />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <a
              href="#contatti"
              onClick={scrollTo("#contatti")}
              className="px-4 py-2 rounded-full text-sm font-semibold text-tv-green-deep/80 hover:text-tv-green-deep hover:bg-tv-mint/40 transition-colors"
            >
              Contatti
            </a>

            <Link
              to="/donazioni"
              onClick={closeAll}
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

        {/* ── Mobile menu — absolute per non estendere l'header e bloccare i click ── */}
        <div
          className={`md:hidden absolute top-full left-0 right-0 mt-2 rounded-3xl bg-tv-cream border border-tv-green-deep/10 p-4 flex flex-col gap-1 transition-all duration-200 origin-top ${
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

          {/* "I nostri Club" collapsibile mobile */}
          <button
            onClick={() => setMobileClubsOpen(o => !o)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-mint/40 w-full text-left"
          >
            I nostri Club
            <ChevronDown size={16} className={`transition-transform duration-200 ${mobileClubsOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileClubsOpen && (
            <div className="ml-3 flex flex-col gap-0.5 border-l-2 border-tv-green-deep/10 pl-3">
              {CLUBS.map(({ to, label, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeAll}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold text-tv-green-deep hover:bg-tv-mint/40"
                >
                  <Icon size={14} className={color} />
                  {label}
                </Link>
              ))}
            </div>
          )}

          <a
            href="#contatti"
            onClick={scrollTo("#contatti")}
            className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-green-deep hover:bg-tv-mint/40"
          >
            Contatti
          </a>

          <Link
            to="/donazioni"
            onClick={closeAll}
            className="px-4 py-3 rounded-2xl text-base font-semibold text-tv-bordeaux hover:bg-tv-bordeaux/8 flex items-center gap-2"
          >
            <Heart size={14} fill="currentColor" /> Dona
          </Link>
          {user ? (
            <>
              <Link to="/area-soci" onClick={closeAll}
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
              <Link to="/login" onClick={closeAll}
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
