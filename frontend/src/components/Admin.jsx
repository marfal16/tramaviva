import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Logo } from "./Logo";
import { LogOut, Trash2, Mail, Users, Calendar, MessageSquare, Lock, ArrowLeft, Plus, Pencil, X, CalendarPlus, IdCard, UserCheck, Sparkles, Download, Loader2, ShieldOff, ChevronDown, ChevronUp, Search, LayoutDashboard, RefreshCw, Menu, PanelLeftClose, BookOpen, Trophy, Check, Heart, Copy, Film } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = "tv_admin_token";

const fmtDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
};

const fmtDay = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
};

const Login = ({ onLogin }) => {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/login`, { token: pwd });
      localStorage.setItem(TOKEN_KEY, pwd);
      toast.success("Benvenut*!");
      onLogin(pwd);
    } catch (err) {
      toast.error("Password non valida.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tv-cream flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="w-full max-w-md bg-white rounded-[2rem] p-8 md:p-10 border border-tv-green-deep/10"
      >
        <div className="flex justify-center mb-6">
          <Logo variant="inline" size={52} />
        </div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-tv-bordeaux">
            <Lock size={14} /> Area riservata
          </div>
          <h1 className="mt-3 font-display font-black text-3xl text-tv-green-deep">
            Dashboard amministratore
          </h1>
        </div>
        <label className="block">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">
            Password
          </div>
          <input
            data-testid="admin-password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          data-testid="admin-login-submit"
          className="btn-tv w-full mt-5 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60"
        >
          {loading ? "Accesso…" : "Accedi"}
        </button>
        <a
          href="/"
          className="mt-5 flex items-center justify-center gap-2 text-sm text-tv-green-deep/60 hover:text-tv-green-deep"
          data-testid="admin-back-home"
        >
          <ArrowLeft size={14} /> Torna al sito
        </a>
      </form>
    </div>
  );
};

const NAV = [
  { key: "home",          label: "Dashboard",           icon: LayoutDashboard },
  { key: "events",        label: "Eventi",               icon: CalendarPlus },
  { key: "books",         label: "Club del Libro",       icon: BookOpen },
  { key: "cineforum",     label: "Cineforum",            icon: Film },
  { key: "missions",      label: "Missioni",             icon: Trophy },
  { key: "members",       label: "Soci tesserati",       icon: IdCard },
  { key: "registrations", label: "Richieste iscrizione", icon: Users },
  { key: "event-signups", label: "Richieste eventi",     icon: Calendar },
  { key: "contacts",      label: "Messaggi",             icon: MessageSquare },
  { key: "donations",    label: "Donazioni",            icon: Heart },
];

const CATEGORIES = ["Laboratori Artistici", "Eventi Sociali", "Passeggiate", "Screening Salute", "Corsi IT"];

const RegistrationCard = ({ row, onPdf, pdfLoadingId, onTogglePayment, onApprove, onCleanup, onResend, onDelete }) => {
  const isArchived = row.status === "archived";
  const isApproved = row.is_member || row.status === "approved";
  const name = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "—";
  const initial = (name[0] || "?").toUpperCase();
  return (
    <article
      data-testid={`admin-row-${row.id}`}
      className="bg-white rounded-3xl overflow-hidden border border-tv-green-deep/10"
    >
      <div className="p-5 md:p-6 flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-tv-green-deep text-tv-cream flex items-center justify-center font-display font-black text-lg shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <span className="font-display font-black text-lg text-tv-green-deep leading-tight">{name}</span>
            <span className="text-xs text-tv-green-deep/40 shrink-0">{fmtDate(row.created_at)}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-tv-green-deep/65">
            {row.email && (
              <a href={`mailto:${row.email}`} className="hover:text-tv-bordeaux flex items-center gap-1 min-w-0">
                <Mail size={12} className="shrink-0" />
                <span className="truncate">{row.email}</span>
              </a>
            )}
            {(row.cellulare || row.phone) && <span>📞 {row.cellulare || row.phone}</span>}
            {row.referral && <span className="text-tv-green-deep/45">✨ {row.referral}</span>}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {(row.is_member || row.status === "approved") && (
              <span
                data-testid={`badge-member-${row.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green text-tv-cream px-2.5 py-1 rounded-full"
              >
                <UserCheck size={10} /> Socio tesserato
              </span>
            )}
            {isArchived ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green-deep/10 text-tv-green-deep/50 px-2.5 py-1 rounded-full">
                🗃 Dati cancellati
              </span>
            ) : row.document_downloaded ? (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-tv-sky/40 text-tv-green-deep px-2.5 py-1 rounded-full">
                📥 PDF scaricato
              </span>
            ) : null}
            {row.tessera_number && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-orange/30 text-tv-green-deep px-2.5 py-1 rounded-full">
                🎫 Tessera #{row.tessera_number}
              </span>
            )}
            {row.metodo_pagamento && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                row.payment_completed
                  ? "bg-tv-green/20 text-tv-green-deep"
                  : row.metodo_pagamento === "elettronico"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-tv-orange/30 text-tv-green-deep"
              }`}>
                {row.metodo_pagamento === "elettronico" ? "💳" : row.metodo_pagamento === "bonifico" ? "🏦" : "💵"}
                {row.metodo_pagamento === "elettronico"
                  ? (row.payment_completed ? "Pagato online" : "Verifica su SumUp")
                  : (row.payment_completed ? "Pagamento ricevuto" : "Da ricevere")}
              </span>
            )}
            {row.is_minorenne && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-tv-bordeaux px-2.5 py-1 rounded-full bg-tv-bordeaux/10">
                👶 Minorenne
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 md:px-6 py-3 bg-tv-sky/20 border-t border-tv-green-deep/[0.08] flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        {/* Gruppo sinistra: azioni documento e pagamento */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isArchived && (
            <button
              onClick={() => onPdf(row.id)}
              disabled={pdfLoadingId === row.id}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-tv-green-deep font-bold text-xs hover:bg-tv-sky/40 transition-colors disabled:opacity-50 border border-tv-green-deep/10"
            >
              {pdfLoadingId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Scarica PDF
            </button>
          )}
          {row.email && (
            <button
              onClick={() => onResend(row)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-tv-green-deep/60 font-bold text-xs hover:bg-tv-sky/40 hover:text-tv-green-deep transition-colors border border-tv-green-deep/10"
              title="Reinvia email di conferma"
            >
              <Mail size={12} /> Reinvia email
            </button>
          )}
          {!isArchived && row.metodo_pagamento && (
            <button
              onClick={() => onTogglePayment(row)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-xs transition-colors ${
                row.payment_completed
                  ? "bg-tv-green/20 text-tv-green-deep hover:bg-tv-bordeaux/10 hover:text-tv-bordeaux"
                  : "bg-tv-orange/30 text-tv-green-deep hover:bg-tv-orange/50"
              }`}
            >
              {row.payment_completed ? "✓ Pagato" : (row.metodo_pagamento === "elettronico" ? "⏳ Verifica SumUp" : "⏳ Da ricevere")}
            </button>
          )}
        </div>

        {/* Gruppo destra: azioni stato e distruttive */}
        <div className="flex items-center gap-2">
          {!isArchived && !isApproved && (
            <button
              onClick={() => onApprove(row)}
              data-testid={`admin-promote-${row.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-tv-green text-tv-cream font-bold text-xs hover:bg-tv-green-deep transition-colors"
            >
              <Sparkles size={12} /> Approva socio
            </button>
          )}
          <div className="w-px h-5 bg-tv-green-deep/10 mx-1" />
          {!isArchived && (
            <button
              onClick={() => onCleanup(row)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux font-bold text-xs hover:bg-tv-bordeaux/20 transition-colors"
            >
              <ShieldOff size={12} /> Cancella dati
            </button>
          )}
          <button
            onClick={() => onDelete(row.id)}
            data-testid={`admin-delete-${row.id}`}
            className="p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
            aria-label="Elimina"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

// ─── Registrations — tabella + filtri ────────────────────────────────────────

const RegistrationRow = ({ row, onPdf, pdfLoadingId, onTogglePayment, onApprove, onCleanup, onResend, onDelete }) => {
  const isArchived = row.status === "archived";
  const isApproved = row.is_member || row.status === "approved";
  const name = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "—";
  return (
    <tr className={`group border-b border-tv-green-deep/5 transition-colors ${
      isArchived ? "opacity-40 hover:opacity-60" : isApproved ? "hover:bg-tv-cream/50" : "bg-amber-50/40 hover:bg-amber-50/70"
    }`} data-testid={`admin-row-${row.id}`}>
      <td className="py-3 pl-4 pr-4 min-w-[160px]">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0 ${
            isApproved ? "bg-tv-green text-tv-cream" : isArchived ? "bg-gray-200 text-gray-500" : "bg-tv-green-deep text-tv-cream"
          }`}>{(name[0] || "?").toUpperCase()}</div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-tv-green-deep">{name}</div>
            {row.is_minorenne && <span className="text-[9px] font-bold text-tv-bordeaux">👶 Minorenne</span>}
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 hidden md:table-cell">
        <div className="text-xs text-tv-green-deep/60 space-y-0.5">
          {row.email && <a href={`mailto:${row.email}`} className="flex items-center gap-1 hover:text-tv-bordeaux truncate max-w-[180px]"><Mail size={10}/>{row.email}</a>}
          {(row.cellulare || row.phone) && <div className="text-tv-green-deep/40">📞 {row.cellulare || row.phone}</div>}
        </div>
      </td>
      <td className="py-3 pr-4 hidden lg:table-cell">
        <span className="text-xs text-tv-green-deep/45">{fmtDate(row.created_at)}</span>
      </td>
      <td className="py-3 pr-4">
        {row.tessera_number
          ? <span className="text-[10px] font-bold bg-tv-orange/25 text-tv-green-deep px-2 py-0.5 rounded-full">🎫 #{row.tessera_number}</span>
          : <span className="text-tv-green-deep/20 text-xs">—</span>}
      </td>
      <td className="py-3 pr-4 hidden md:table-cell">
        {row.document_downloaded
          ? <span className="text-[10px] font-bold bg-tv-sky/40 text-tv-green-deep px-2 py-0.5 rounded-full">📥 Scaricato</span>
          : <span className="text-tv-green-deep/20 text-xs">—</span>}
      </td>
      <td className="py-3 pr-4 hidden lg:table-cell">
        {row.metodo_pagamento
          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.payment_completed ? "bg-tv-green/20 text-tv-green-deep" : "bg-tv-orange/20 text-tv-bordeaux"}`}>
              {row.payment_completed ? "✓" : "⏳"} {row.metodo_pagamento}
            </span>
          : <span className="text-tv-green-deep/20 text-xs">—</span>}
      </td>
      <td className="py-3 pr-4">
        {isArchived
          ? <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Archiviato</span>
          : isApproved
          ? <span className="text-[10px] font-bold bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full">✓ Socio</span>
          : <span className="text-[10px] font-bold bg-tv-orange/15 text-tv-bordeaux px-2 py-0.5 rounded-full">⏳ In attesa</span>}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
          {!isArchived && <button onClick={() => onPdf(row.id)} disabled={pdfLoadingId === row.id} title="Scarica PDF"
            className="p-1.5 rounded-lg bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky transition-colors">
            {pdfLoadingId === row.id ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>}
          </button>}
          {row.email && <button onClick={() => onResend(row)} title="Reinvia email"
            className="p-1.5 rounded-lg bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky transition-colors">
            <Mail size={13}/>
          </button>}
          {!isArchived && row.metodo_pagamento && <button onClick={() => onTogglePayment(row)}
            title={row.payment_completed ? "Annulla pagamento" : "Segna pagato"}
            className={`p-1.5 rounded-lg transition-colors text-xs ${row.payment_completed ? "bg-tv-green/20 text-tv-green-deep hover:bg-tv-bordeaux/10" : "bg-tv-orange/20 text-tv-green-deep hover:bg-tv-orange/40"}`}>
            💸
          </button>}
          {!isArchived && !isApproved && <button onClick={() => onApprove(row)} title="Approva socio"
            className="p-1.5 rounded-lg bg-tv-green/20 text-tv-green-deep hover:bg-tv-green hover:text-tv-cream transition-colors">
            <Sparkles size={13}/>
          </button>}
          {!isArchived && <button onClick={() => onCleanup(row)} title="Cancella dati"
            className="p-1.5 rounded-lg bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux/20 transition-colors">
            <ShieldOff size={13}/>
          </button>}
          <button onClick={() => onDelete(row.id)} title="Elimina"
            className="p-1.5 rounded-lg bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      </td>
    </tr>
  );
};

const RegistrationsManager = ({ list, onPdf, pdfLoadingId, onTogglePayment, onApprove, onCleanup, onResend, onDelete }) => {
  const [activeFilter, setActiveFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const counts = useMemo(() => ({
    pending: list.filter(r => !r.is_member && r.status !== "approved" && r.status !== "archived").length,
    approved: list.filter(r => r.is_member || r.status === "approved").length,
    archived: list.filter(r => r.status === "archived").length,
  }), [list]);

  const filteredList = useMemo(() => {
    let items = [...list];
    if (activeFilter === "pending") items = items.filter(r => !r.is_member && r.status !== "approved" && r.status !== "archived");
    else if (activeFilter === "approved") items = items.filter(r => r.is_member || r.status === "approved");
    else if (activeFilter === "archived") items = items.filter(r => r.status === "archived");
    const q = searchQuery.trim().toLowerCase();
    if (q) items = items.filter(r =>
      (`${r.first_name || ""} ${r.last_name || ""}`).toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q)
    );
    items.sort((a, b) => {
      const v = sortField === "name"
        ? (`${a.first_name || ""} ${a.last_name || ""}`).localeCompare(`${b.first_name || ""} ${b.last_name || ""}`, "it")
        : new Date(a.created_at || 0) - new Date(b.created_at || 0);
      return sortDir === "asc" ? v : -v;
    });
    return items;
  }, [list, activeFilter, searchQuery, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };
  const SortArrow = ({ field }) => sortField === field
    ? (sortDir === "asc" ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)
    : null;

  if (list.length === 0) {
    return (
      <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60" data-testid="admin-empty">
        Ancora niente qui. Quando qualcuno invierà un modulo, lo vedrai apparire.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-tv-green-deep/10 overflow-hidden" data-testid="admin-list">
      <div className="px-5 py-4 border-b border-tv-green-deep/10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-tv-cream rounded-xl p-1">
          {[
            { key: "pending", label: `In attesa (${counts.pending})` },
            { key: "approved", label: `Approvati (${counts.approved})` },
            { key: "archived", label: `Archiviati (${counts.archived})` },
          ].map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === f.key ? "bg-tv-green-deep text-tv-cream shadow-sm" : "text-tv-green-deep/50 hover:text-tv-green-deep"
              }`}>{f.label}</button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-green-deep/35 pointer-events-none"/>
          <input type="text" placeholder="Cerca nome o email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 rounded-xl bg-tv-cream border border-tv-green-deep/15 focus:border-tv-green outline-none text-xs text-tv-green-deep"/>
        </div>
      </div>
      {filteredList.length === 0 ? (
        <div className="text-center py-16 text-tv-green-deep/40 text-sm">Nessun risultato.</div>
      ) : (
        <>
          {/* Desktop: tabella */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-tv-cream/70 sticky top-0">
                <tr className="border-b border-tv-green-deep/10">
                  <th className="py-2.5 pl-4 pr-4 text-left">
                    <button onClick={() => toggleSort("name")} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 hover:text-tv-green-deep">Nome <SortArrow field="name"/></button>
                  </th>
                  <th className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 hidden md:table-cell">Contatti</th>
                  <th className="py-2.5 pr-4 text-left hidden lg:table-cell">
                    <button onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 hover:text-tv-green-deep">Data <SortArrow field="created_at"/></button>
                  </th>
                  <th className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Tessera</th>
                  <th className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 hidden md:table-cell">PDF</th>
                  <th className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 hidden lg:table-cell">Pagamento</th>
                  <th className="py-2.5 pr-4 text-left text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Stato</th>
                  <th className="py-2.5 pr-4 w-36"/>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(row => (
                  <RegistrationRow key={row.id} row={row} onPdf={onPdf} pdfLoadingId={pdfLoadingId}
                    onTogglePayment={onTogglePayment} onApprove={onApprove} onCleanup={onCleanup}
                    onResend={onResend} onDelete={onDelete}/>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="block md:hidden space-y-2 p-3">
            {filteredList.map(row => {
              const isArchived = row.status === "archived";
              const isApproved = row.is_member || row.status === "approved";
              const name = `${row.first_name || ""} ${row.last_name || ""}`.trim() || "—";
              return (
                <div key={row.id} className={`rounded-2xl border p-3 ${
                  isArchived ? "opacity-50 bg-gray-50 border-gray-200"
                  : isApproved ? "bg-white border-tv-green/25"
                  : "bg-amber-50 border-tv-orange/20"
                }`}>
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isApproved ? "bg-tv-green text-tv-cream" : isArchived ? "bg-gray-200 text-gray-500" : "bg-tv-green-deep text-tv-cream"
                    }`}>{(name[0] || "?").toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-tv-green-deep">{name}</div>
                      {row.email && <div className="text-[11px] text-tv-green-deep/50 truncate">{row.email}</div>}
                      {(row.cellulare || row.phone) && <div className="text-[11px] text-tv-green-deep/40">📞 {row.cellulare || row.phone}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {row.tessera_number && <span className="text-[10px] font-bold bg-tv-orange/25 text-tv-green-deep px-2 py-0.5 rounded-full">🎫 #{row.tessera_number}</span>}
                      {isArchived
                        ? <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Archiviato</span>
                        : isApproved
                        ? <span className="text-[10px] font-bold bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full">✓ Socio</span>
                        : <span className="text-[10px] font-bold bg-tv-orange/15 text-tv-bordeaux px-2 py-0.5 rounded-full">⏳ In attesa</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {!isArchived && (
                      <button onClick={() => onPdf(row.id)} disabled={pdfLoadingId === row.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-sky/30 text-tv-green-deep text-[11px] font-bold rounded-full hover:bg-tv-sky transition-colors disabled:opacity-50">
                        {pdfLoadingId === row.id ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>} PDF
                      </button>
                    )}
                    {row.email && (
                      <button onClick={() => onResend(row)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-sky/30 text-tv-green-deep/70 text-[11px] font-bold rounded-full hover:bg-tv-sky hover:text-tv-green-deep transition-colors">
                        <Mail size={11}/> Email
                      </button>
                    )}
                    {!isArchived && row.metodo_pagamento && (
                      <button onClick={() => onTogglePayment(row)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-full transition-colors ${row.payment_completed ? "bg-tv-green/20 text-tv-green-deep hover:bg-tv-bordeaux/10 hover:text-tv-bordeaux" : "bg-tv-orange/20 text-tv-green-deep hover:bg-tv-orange/30"}`}>
                        {row.payment_completed ? "✓ Pagato" : "⏳ Pagamento"}
                      </button>
                    )}
                    {!isArchived && !isApproved && (
                      <button onClick={() => onApprove(row)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-green text-tv-cream text-[11px] font-bold rounded-full hover:bg-tv-green-deep transition-colors">
                        <Sparkles size={11}/> Approva
                      </button>
                    )}
                    {!isArchived && (
                      <button onClick={() => onCleanup(row)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-bordeaux/10 text-tv-bordeaux text-[11px] font-bold rounded-full hover:bg-tv-bordeaux/20 transition-colors">
                        <ShieldOff size={11}/> Dati
                      </button>
                    )}
                    <button onClick={() => onDelete(row.id)}
                      className="p-1.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const STATUS_LABELS = {
  in_lettura: { label: "In lettura", color: "bg-tv-green/20 text-tv-green-deep" },
  concluso:   { label: "Concluso",   color: "bg-tv-sky/30 text-tv-green-deep" },
  prossimamente: { label: "Prossimamente", color: "bg-tv-orange/30 text-tv-green-deep" },
};

const BOOK_GENRES = [
  "Romanzo", "Romanzo storico", "Romanzo contemporaneo", "Romanzo rosa",
  "Giallo", "Thriller", "Mystery", "Horror",
  "Fantasy", "Fantascienza", "Avventura",
  "Classico", "Letteratura italiana", "Letteratura straniera",
  "Narrativa", "Raccolta di racconti",
  "Biografia", "Autobiografia", "Memorie",
  "Saggio", "Saggistica",
  "Self-help", "Crescita personale", "Benessere e Self-Help",
  "Psicologia", "Filosofia", "Spiritualità",
  "Storia", "Scienza", "Natura",
  "Economia", "Business",
  "Poesia", "Teatro",
  "Young Adult", "Graphic novel", "Fumetto",
  "Umorismo", "Satira",
  "Viaggio", "Arte", "Cucina",
  "Altro",
];

const FILM_GENRES = [
  "Azione", "Avventura", "Animazione", "Commedia", "Commedia romantica",
  "Drammatico", "Fantasy", "Fantascienza", "Horror", "Thriller",
  "Giallo / Noir", "Storico", "Biografico / Documentario", "Western",
  "Musical", "Guerra", "Romantico", "Arte / Surrealismo",
  "Cult", "Classico", "Cinema del mondo", "Altro",
];

const FILM_STATUS_LABELS = {
  in_visione:    { label: "In visione",    color: "bg-tv-sky/30 text-tv-green-deep" },
  concluso:      { label: "Concluso",      color: "bg-tv-green/20 text-tv-green-deep" },
  prossimamente: { label: "Prossimamente", color: "bg-tv-orange/15 text-tv-orange" },
};

const FILM_EMPTY = {
  title: "", director: "", cover_url: "", genre: "", status: "prossimamente",
  year: "", duration: "", screening_month: "", description: "", recensione: "",
  linked_event_ids: [],
};

const BOOK_EMPTY = {
  title: "", author: "", cover_url: "", genre: "", status: "in_lettura",
  reading_month: "", start_date: "", end_date: "", description: "", recensione: "",
  pages: "", linked_event_ids: [], in_biblioteca: false, is_lent: false, is_to_find: false, quantity: 1, lent_to: "", lent_date: "",
};

const BookEditor = ({ book, events, onSave, onClose, token }) => {
  const isNew = !book.id;
  const [form, setForm] = useState({ ...BOOK_EMPTY, ...book });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      toast.error("Titolo e autore sono obbligatori.");
      return;
    }
    setSaving(true);
    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        cover_url: form.cover_url?.trim() || null,
        genre: form.genre?.trim() || null,
        status: form.status,
        reading_month: form.reading_month || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description?.trim() || null,
        recensione: form.recensione?.trim() || null,
        linked_event_ids: form.linked_event_ids || [],
        pages: form.pages ? parseInt(form.pages, 10) : null,
        in_biblioteca: !!form.in_biblioteca,
        is_lent: !!form.is_lent,
        is_to_find: !!form.is_to_find,
        quantity: form.quantity ? parseInt(form.quantity, 10) : 1,
        lent_to: form.lent_to?.trim() || null,
        lent_date: form.lent_date || null,
      };
      if (isNew) {
        const res = await axios.post(`${API}/admin/books`, payload, authHeader);
        toast.success("Libro aggiunto!");
        onSave(res.data);
      } else {
        const res = await axios.put(`${API}/admin/books/${book.id}`, payload, authHeader);
        toast.success("Libro aggiornato!");
        onSave(res.data);
      }
      onClose();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-tv-green-deep/10">
          <h2 className="font-display font-black text-xl text-tv-green-deep">
            {isNew ? "Aggiungi libro" : "Modifica libro"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-green-deep/10"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Titolo *</div>
              <input className={fieldClass} value={form.title} onChange={e => set("title", e.target.value)} required />
            </label>
            <label>
              <div className={labelClass}>Autore *</div>
              <input className={fieldClass} value={form.author} onChange={e => set("author", e.target.value)} required />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Genere</div>
              <select className={fieldClass} value={form.genre || ""} onChange={e => set("genre", e.target.value)}>
                <option value="">— Seleziona —</option>
                {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>
              <div className={labelClass}>Stato</div>
              <select className={fieldClass} value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="in_lettura">In lettura</option>
                <option value="concluso">Concluso</option>
                <option value="prossimamente">Prossimamente</option>
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-4 gap-4 items-end">
            <label>
              <div className={labelClass}>Mese lettura</div>
              <input className={fieldClass} value={form.reading_month || ""} onChange={e => set("reading_month", e.target.value)} placeholder="es. 2025-07" />
            </label>
            <label>
              <div className={labelClass}>Pagine</div>
              <input type="number" min="1" className={fieldClass} value={form.pages || ""} onChange={e => set("pages", e.target.value)} placeholder="es. 320" />
            </label>
            <label>
              <div className={labelClass}>Data inizio</div>
              <input type="date" className={fieldClass} value={form.start_date || ""} onChange={e => set("start_date", e.target.value)} />
            </label>
            <label>
              <div className={labelClass}>Data fine</div>
              <input type="date" className={fieldClass} value={form.end_date || ""} onChange={e => set("end_date", e.target.value)} />
            </label>
          </div>
          <label>
            <div className={labelClass}>URL copertina</div>
            <input className={fieldClass} value={form.cover_url || ""} onChange={e => set("cover_url", e.target.value)} placeholder="https://..." />
          </label>
          <label>
            <div className={labelClass}>Descrizione / perché lo leggiamo</div>
            <textarea className={`${fieldClass} resize-none`} rows={3} value={form.description || ""} onChange={e => set("description", e.target.value)} />
          </label>
          <label>
            <div className={labelClass}>Recensione redazione (dopo la lettura)</div>
            <textarea className={`${fieldClass} resize-none`} rows={4} value={form.recensione || ""} onChange={e => set("recensione", e.target.value)} />
          </label>

          {/* Biblioteca */}
          <div className="rounded-2xl border border-tv-green-deep/10 p-4 grid gap-3">
            <div className="text-xs font-black uppercase tracking-wider text-tv-green-deep/50">Biblioteca fisica</div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={!!form.in_biblioteca} onChange={e => set("in_biblioteca", e.target.checked)} className="w-4 h-4 accent-tv-green-deep" />
              <span className="text-sm font-bold text-tv-green-deep">Disponibile in sede</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={!!form.is_to_find} onChange={e => set("is_to_find", e.target.checked)} className="w-4 h-4 accent-tv-orange" />
              <span className="text-sm font-bold text-tv-orange">Da reperire in autonomia</span>
            </label>
            {(form.in_biblioteca || form.is_to_find) && (
              <label>
                <div className={labelClass}>Numero copie disponibili</div>
                <input type="number" min="1" className={fieldClass} value={form.quantity || 1} onChange={e => set("quantity", e.target.value)} placeholder="es. 1" />
              </label>
            )}
            {form.is_lent && (
              <div className="grid sm:grid-cols-2 gap-3">
                <label>
                  <div className={labelClass}>Prestato a</div>
                  <input className={fieldClass} value={form.lent_to || ""} onChange={e => set("lent_to", e.target.value)} placeholder="Nome del lettore" />
                </label>
                <label>
                  <div className={labelClass}>Data prestito</div>
                  <input type="date" className={fieldClass} value={form.lent_date || ""} onChange={e => set("lent_date", e.target.value)} />
                </label>
              </div>
            )}
          </div>

          {events && events.filter(ev => ev.title?.toLowerCase().includes("club del libro")).length > 0 && (
            <div>
              <div className={labelClass}>Collega a eventi</div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {events.filter(ev => ev.title?.toLowerCase().includes("club del libro")).map(ev => (
                  <label key={ev.id} className="flex items-center gap-2 text-sm text-tv-green-deep cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.linked_event_ids || []).includes(ev.id)}
                      onChange={e => {
                        const ids = form.linked_event_ids || [];
                        set("linked_event_ids", e.target.checked ? [...ids, ev.id] : ids.filter(id => id !== ev.id));
                      }}
                    />
                    {ev.title}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm hover:bg-tv-green-deep/5">
              Annulla
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm disabled:opacity-60">
              {saving ? "Salvo…" : isNew ? "Aggiungi" : "Salva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── FilmEditor ───────────────────────────────────────────────────────────────
const FilmEditor = ({ film, events, onSave, onClose, token }) => {
  const isNew = !film.id;
  const [form, setForm] = useState({ ...FILM_EMPTY, ...film });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.director.trim()) { toast.error("Titolo e regista sono obbligatori."); return; }
    setSaving(true);
    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        title: form.title.trim(),
        director: form.director.trim(),
        cover_url: form.cover_url?.trim() || null,
        genre: form.genre?.trim() || null,
        status: form.status,
        year: form.year ? parseInt(form.year, 10) : null,
        duration: form.duration ? parseInt(form.duration, 10) : null,
        screening_month: form.screening_month || null,
        description: form.description?.trim() || null,
        recensione: form.recensione?.trim() || null,
        linked_event_ids: form.linked_event_ids || [],
      };
      if (isNew) {
        const res = await axios.post(`${API}/admin/films`, payload, authHeader);
        toast.success("Film aggiunto!");
        onSave(res.data);
      } else {
        const res = await axios.put(`${API}/admin/films/${film.id}`, payload, authHeader);
        toast.success("Film aggiornato!");
        onSave(res.data);
      }
      onClose();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tv-green-deep/50 p-4" onClick={onClose}>
      <div className="bg-tv-cream rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-tv-green-deep/10">
          <h2 className="font-display font-black text-xl text-tv-green-deep">
            {isNew ? "Aggiungi film" : "Modifica film"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-green-deep/10"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Titolo *</div>
              <input className={fieldClass} value={form.title} onChange={e => set("title", e.target.value)} required />
            </label>
            <label>
              <div className={labelClass}>Regista *</div>
              <input className={fieldClass} value={form.director} onChange={e => set("director", e.target.value)} required />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <div className={labelClass}>Genere</div>
              <select className={fieldClass} value={form.genre || ""} onChange={e => set("genre", e.target.value)}>
                <option value="">— Seleziona —</option>
                {FILM_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>
              <div className={labelClass}>Stato</div>
              <select className={fieldClass} value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="in_visione">In visione</option>
                <option value="concluso">Concluso</option>
                <option value="prossimamente">Prossimamente</option>
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <label>
              <div className={labelClass}>Mese proiezione</div>
              <input className={fieldClass} value={form.screening_month || ""} onChange={e => set("screening_month", e.target.value)} placeholder="es. 2025-09" />
            </label>
            <label>
              <div className={labelClass}>Anno uscita</div>
              <input type="number" min="1900" max="2099" className={fieldClass} value={form.year || ""} onChange={e => set("year", e.target.value)} placeholder="es. 2023" />
            </label>
            <label>
              <div className={labelClass}>Durata (min)</div>
              <input type="number" min="1" className={fieldClass} value={form.duration || ""} onChange={e => set("duration", e.target.value)} placeholder="es. 120" />
            </label>
          </div>
          <label>
            <div className={labelClass}>URL locandina</div>
            <input className={fieldClass} value={form.cover_url || ""} onChange={e => set("cover_url", e.target.value)} placeholder="https://..." />
          </label>
          <label>
            <div className={labelClass}>Descrizione / perché lo guardiamo</div>
            <textarea className={`${fieldClass} resize-none`} rows={3} value={form.description || ""} onChange={e => set("description", e.target.value)} />
          </label>
          <label>
            <div className={labelClass}>Recensione redazione (dopo la proiezione)</div>
            <textarea className={`${fieldClass} resize-none`} rows={4} value={form.recensione || ""} onChange={e => set("recensione", e.target.value)} />
          </label>
          {events && events.filter(ev => ev.title?.toLowerCase().includes("cineforum")).length > 0 && (
            <div>
              <div className={labelClass}>Collega a eventi</div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {events.filter(ev => ev.title?.toLowerCase().includes("cineforum")).map(ev => (
                  <label key={ev.id} className="flex items-center gap-2 text-sm text-tv-green-deep cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.linked_event_ids || []).includes(ev.id)}
                      onChange={e => {
                        const ids = form.linked_event_ids || [];
                        set("linked_event_ids", e.target.checked ? [...ids, ev.id] : ids.filter(id => id !== ev.id));
                      }}
                    />
                    {ev.title}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm hover:bg-tv-green-deep/5">
              Annulla
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-full bg-tv-sky text-white font-bold text-sm disabled:opacity-60">
              {saving ? "Salvo…" : isNew ? "Aggiungi" : "Salva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Sottosezione Prestiti ────────────────────────────────────────────────────
const LoanManager = ({ books, token, onReload }) => {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", cover_url: "", lent_to: "", lent_date: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const libraryBooks = books.filter(b => b.is_library_book || b.in_biblioteca);

  const handleReturn = async (book) => {
    try {
      await axios.put(`${API}/admin/books/${book.id}`,
        { is_lent: false, lent_to: null, lent_date: null, is_library_book: true },
        authHeader
      );
      toast.success("Segnato come disponibile.");
      onReload();
    } catch { toast.error("Errore."); }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Eliminare "${book.title}"?`)) return;
    try {
      await axios.delete(`${API}/admin/books/${book.id}`, authHeader);
      toast.success("Libro eliminato.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const startEdit = (book) => {
    setEditingId(book.id);
    setEditForm({ title: book.title || "", author: book.author || "", cover_url: book.cover_url || "", lent_to: book.lent_to || "", lent_date: book.lent_date || "" });
  };

  const handleSaveEdit = async (book) => {
    setSavingEdit(true);
    try {
      const lent_to = editForm.lent_to.trim();
      await axios.put(`${API}/admin/books/${book.id}`, {
        title: editForm.title.trim() || book.title,
        author: editForm.author.trim() || "—",
        cover_url: editForm.cover_url.trim() || null,
        lent_to: lent_to || null,
        lent_date: editForm.lent_date || null,
        is_lent: !!lent_to,
        is_library_book: true,
      }, authHeader);
      toast.success("Salvato.");
      setEditingId(null);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSavingEdit(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Inserisci il titolo del libro."); return; }
    setSaving(true);
    try {
      const lent_to = form.lent_to.trim();
      await axios.post(`${API}/admin/books`, {
        title: form.title.trim(),
        author: form.author.trim() || "—",
        cover_url: form.cover_url.trim() || null,
        is_lent: !!lent_to,
        lent_to: lent_to || null,
        lent_date: form.lent_date || null,
        in_biblioteca: true,
        is_library_book: true,
      }, authHeader);
      toast.success("Libro aggiunto.");
      setForm({ title: "", author: "", cover_url: "", lent_to: "", lent_date: "" });
      setAdding(false);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";
  const editFieldClass = "w-full px-3 py-2 rounded-xl bg-tv-cream border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-black text-xl text-tv-green-deep">Biblioteca condivisa</h3>
        <button onClick={() => setAdding(a => !a)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm hover:bg-tv-bordeaux/80 transition-colors">
          <Plus size={15} /> Aggiungi libro
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="rounded-2xl border border-tv-bordeaux/20 bg-tv-bordeaux/5 p-5 grid gap-4">
          <div className="text-sm font-black text-tv-bordeaux uppercase tracking-wider">Nuovo libro</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Titolo *</label>
              <input className={fieldClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="es. La montagna sei tu" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Autore</label>
              <input className={fieldClass} value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="es. Elena Ferrante" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">URL copertina</label>
            <input className={fieldClass} value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Prestato a <span className="text-tv-green-deep/30 normal-case font-normal">(vuoto = disponibile)</span></label>
              <input className={fieldClass} value={form.lent_to} onChange={e => setForm(f => ({ ...f, lent_to: e.target.value }))} placeholder="Nome e cognome del lettore" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Data prestito</label>
              <input type="date" className={fieldClass} value={form.lent_date} onChange={e => setForm(f => ({ ...f, lent_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm disabled:opacity-60">{saving ? "Salvo…" : "Conferma"}</button>
          </div>
        </form>
      )}

      {libraryBooks.length === 0 ? (
        <div className="rounded-2xl bg-white border border-tv-green-deep/10 p-8 text-center text-tv-green-deep/40">
          Nessun libro registrato.
        </div>
      ) : (
        <div className="grid gap-3">
          {libraryBooks.map(book => (
            <div key={book.id} className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-10 h-14 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded-xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-tv-green-deep/25" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-tv-green-deep leading-tight truncate">{book.title}</div>
                  <div className="text-sm text-tv-green-deep/50">{book.author}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {book.is_lent ? (
                      <>
                        <span className="text-tv-bordeaux font-bold">📤 In prestito</span>
                        {book.lent_to && <span className="text-tv-green-deep/60">👤 {book.lent_to}</span>}
                        {book.lent_date && <span className="text-tv-green-deep/60">📅 dal {fmtDay(book.lent_date)}</span>}
                      </>
                    ) : (
                      <span className="text-tv-green-deep/60 font-bold">✅ Disponibile</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {book.is_lent && (
                    <button onClick={() => handleReturn(book)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-green/20 text-tv-green-deep font-bold text-xs hover:bg-tv-green/40 transition-colors">
                      ✓ Restituito
                    </button>
                  )}
                  <button onClick={() => editingId === book.id ? setEditingId(null) : startEdit(book)} className="p-2 rounded-full hover:bg-tv-green-deep/8 text-tv-green-deep/40 hover:text-tv-green-deep transition-colors" title="Modifica">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(book)} className="p-2 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux/40 hover:text-tv-bordeaux transition-colors" title="Elimina">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {editingId === book.id && (
                <div className="border-t border-tv-green-deep/8 bg-tv-cream/60 p-4 grid gap-3">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1">Titolo</label>
                      <input className={editFieldClass} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1">Autore</label>
                      <input className={editFieldClass} value={editForm.author} onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1">URL copertina</label>
                    <input className={editFieldClass} value={editForm.cover_url} onChange={e => setEditForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1">Prestato a <span className="text-tv-green-deep/25 normal-case font-normal">(vuoto = disponibile)</span></label>
                      <input className={editFieldClass} value={editForm.lent_to} onChange={e => setEditForm(f => ({ ...f, lent_to: e.target.value }))} placeholder="Nome e cognome" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1">Data prestito</label>
                      <input type="date" className={editFieldClass} value={editForm.lent_date} onChange={e => setEditForm(f => ({ ...f, lent_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-xs">Annulla</button>
                    <button type="button" onClick={() => handleSaveEdit(book)} disabled={savingEdit} className="px-4 py-1.5 rounded-full bg-tv-green-deep text-tv-cream font-bold text-xs disabled:opacity-60">{savingEdit ? "…" : "Salva"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── ProposalAdminCard ─────────────────────────────────────────────────────────
const ProposalAdminCard = ({ p, onDelete, onReload, token }) => {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [showVoters, setShowVoters] = useState(false);
  const [clearingAnon, setClearingAnon] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const voters = p.voters || [];
  const anonCount = p.votes - voters.length;

  const handleClearAnon = async () => {
    if (!window.confirm(`Rimuovere ${anonCount} vot${anonCount === 1 ? "o anonimo" : "i anonimi"}? Rimarranno solo i voti con nome registrato.`)) return;
    setClearingAnon(true);
    try {
      await axios.post(`${API}/admin/proposals/${p.id}/remove-anon-votes`, {}, authHeader);
      toast.success("Voti anonimi rimossi.");
      onReload();
    } catch { toast.error("Errore."); }
    finally { setClearingAnon(false); }
  };

  const startEdit = () => {
    setEditForm({ title: p.title || "", author: p.author || "", genre: p.genre || "", cover_url: p.cover_url || "", description: p.description || "", proposed_month: p.proposed_month || "" });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await axios.put(`${API}/admin/proposals/${p.id}`, {
        title: editForm.title.trim() || p.title,
        author: editForm.author.trim() || p.author,
        genre: editForm.genre.trim() || null,
        cover_url: editForm.cover_url.trim() || null,
        description: editForm.description.trim() || null,
        proposed_month: editForm.proposed_month || p.proposed_month,
      }, authHeader);
      toast.success("Proposta aggiornata.");
      setEditing(false);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSavingEdit(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-10 h-14 object-cover rounded-xl shrink-0" />
        ) : (
          <div className="w-10 h-14 rounded-xl bg-tv-green-deep/8 flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-tv-green-deep/25" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-tv-green-deep">{p.title}</span>
            <span className="text-sm text-tv-green-deep/55">{p.author}</span>
            {p.genre && <span className="text-xs text-tv-green-deep/40 italic">{p.genre}</span>}
            <span className="text-xs font-black text-tv-orange">👍 {p.votes} voti</span>
            <span className="text-xs text-tv-green-deep/30">{p.proposed_month}</span>
          </div>
          {(p.nome || p.cognome) && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-tv-green-deep/55">Proposto da: <strong>{[p.nome, p.cognome].filter(Boolean).join(" ")}</strong></span>
              {p.in_community_whatsapp !== null && p.in_community_whatsapp !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.in_community_whatsapp ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.in_community_whatsapp ? "Community" : "Non nella community"}
                </span>
              )}
            </div>
          )}
          {voters.length > 0 && (
            <button onClick={() => setShowVoters(v => !v)}
              className="mt-1.5 text-[11px] font-bold text-tv-sky hover:text-tv-green-deep transition-colors flex items-center gap-1">
              👥 {voters.length} {voters.length === 1 ? "votante" : "votanti"} {showVoters ? "▲" : "▼"}
            </button>
          )}
          {showVoters && voters.length > 0 && (
            <div className="mt-2 pl-2 border-l-2 border-tv-sky/30 grid gap-1">
              {voters.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-tv-green-deep/70">
                  <div className="w-5 h-5 rounded-full bg-tv-sky/30 text-tv-green-deep flex items-center justify-center font-black text-[9px] shrink-0">
                    {(v.nome?.[0] || "?").toUpperCase()}
                  </div>
                  <span className="font-medium">{[v.nome, v.cognome].filter(Boolean).join(" ") || "Anonimo"}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${v.in_community_whatsapp ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {v.in_community_whatsapp ? "Community" : "Non nella community"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {anonCount > 0 && (
            <button
              onClick={handleClearAnon}
              disabled={clearingAnon}
              title={`Rimuovi ${anonCount} vot${anonCount === 1 ? "o anonimo" : "i anonimi"}`}
              className="text-[10px] font-bold px-2 py-1 rounded-full bg-tv-green-deep/8 text-tv-green-deep/50 hover:bg-tv-orange/15 hover:text-tv-orange transition-colors disabled:opacity-50"
            >
              {clearingAnon ? "…" : `🕵 ${anonCount} anon.`}
            </button>
          )}
          <button onClick={startEdit} className="p-1.5 rounded-full hover:bg-tv-sky/10 text-tv-sky self-end" title="Modifica">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux self-end" title="Elimina">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {editing && (
        <div className="border-t border-tv-green-deep/10 bg-tv-cream/30 p-4 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Titolo</label>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tv-green-deep/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Autore</label>
              <input value={editForm.author} onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tv-green-deep/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Genere</label>
              <input value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tv-green-deep/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">URL Copertina</label>
              <input value={editForm.cover_url} onChange={e => setEditForm(f => ({ ...f, cover_url: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tv-green-deep/30" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Descrizione</label>
            <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tv-green-deep/30 resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Mese di riferimento</label>
            <input type="month" value={editForm.proposed_month} onChange={e => setEditForm(f => ({ ...f, proposed_month: e.target.value }))}
              className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-tv-green-deep/30" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-lg border border-tv-green-deep/20 text-tv-green-deep/50 hover:bg-tv-green-deep/5">Annulla</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="text-xs px-3 py-1 rounded-lg bg-tv-green-deep text-white font-bold hover:bg-tv-green-deep/80 disabled:opacity-50">
              {savingEdit ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── FilmProposalAdminCard ─────────────────────────────────────────────────────
const FilmProposalAdminCard = ({ p, onDelete, onReload, token }) => {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [showVoters, setShowVoters] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const voters = p.voters || [];

  const startEdit = () => {
    setEditForm({ title: p.title || "", director: p.director || "", genre: p.genre || "", cover_url: p.cover_url || "", description: p.description || "", proposed_month: p.proposed_month || "" });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await axios.put(`${API}/admin/film-proposals/${p.id}`, {
        title: editForm.title.trim() || p.title,
        director: editForm.director.trim() || p.director,
        genre: editForm.genre.trim() || null,
        cover_url: editForm.cover_url.trim() || null,
        description: editForm.description.trim() || null,
        proposed_month: editForm.proposed_month || p.proposed_month,
      }, authHeader);
      toast.success("Proposta aggiornata.");
      setEditing(false);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSavingEdit(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        {p.cover_url ? (
          <img src={p.cover_url} alt={p.title} className="w-10 h-14 object-cover rounded-xl shrink-0" />
        ) : (
          <div className="w-10 h-14 rounded-xl bg-tv-sky/10 flex items-center justify-center shrink-0">
            <Film size={16} className="text-tv-sky/50" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-tv-green-deep">{p.title}</span>
            <span className="text-sm text-tv-green-deep/55">{p.director}</span>
            {p.genre && <span className="text-xs text-tv-green-deep/40 italic">{p.genre}</span>}
            <span className="text-xs font-black text-tv-orange">👍 {p.votes} voti</span>
            <span className="text-xs text-tv-green-deep/30">{p.proposed_month}</span>
          </div>
          {(p.nome || p.cognome) && (
            <div className="mt-1 text-xs text-tv-green-deep/55">
              Proposto da: <strong>{[p.nome, p.cognome].filter(Boolean).join(" ")}</strong>
              {p.in_community_whatsapp !== null && p.in_community_whatsapp !== undefined && (
                <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.in_community_whatsapp ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.in_community_whatsapp ? "Community" : "Non nella community"}
                </span>
              )}
            </div>
          )}
          {voters.length > 0 && (
            <button onClick={() => setShowVoters(v => !v)}
              className="mt-1.5 text-[11px] font-bold text-tv-sky hover:text-tv-green-deep transition-colors flex items-center gap-1">
              👥 {voters.length} {voters.length === 1 ? "votante" : "votanti"} {showVoters ? "▲" : "▼"}
            </button>
          )}
          {showVoters && voters.length > 0 && (
            <div className="mt-2 pl-2 border-l-2 border-tv-sky/30 grid gap-1">
              {voters.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-tv-green-deep/70">
                  <div className="w-5 h-5 rounded-full bg-tv-sky/30 text-tv-green-deep flex items-center justify-center font-black text-[9px] shrink-0">
                    {(v.nome?.[0] || "?").toUpperCase()}
                  </div>
                  <span className="font-medium">{[v.nome, v.cognome].filter(Boolean).join(" ") || "Anonimo"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={startEdit} className="p-1.5 rounded-full hover:bg-tv-sky/10 text-tv-sky self-end" title="Modifica">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux self-end" title="Elimina">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {editing && (
        <div className="border-t border-tv-green-deep/10 bg-tv-cream/30 p-4 grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Titolo</label>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Regista</label>
              <input value={editForm.director} onChange={e => setEditForm(f => ({ ...f, director: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Genere</label>
              <input value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">URL Locandina</label>
              <input value={editForm.cover_url} onChange={e => setEditForm(f => ({ ...f, cover_url: e.target.value }))}
                className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Descrizione</label>
            <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-tv-green-deep/50 mb-1">Mese di riferimento</label>
            <input type="month" value={editForm.proposed_month} onChange={e => setEditForm(f => ({ ...f, proposed_month: e.target.value }))}
              className="w-full text-sm border border-tv-green-deep/20 rounded-lg px-2 py-1 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-lg border border-tv-green-deep/20 text-tv-green-deep/50">Annulla</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} className="text-xs px-3 py-1 rounded-lg bg-tv-sky text-white font-bold disabled:opacity-50">
              {savingEdit ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── BookManager con sub-tab ──────────────────────────────────────────────────
const BookManager = ({ books, events, reviews, proposals, token, onReload }) => {
  const [subTab, setSubTab] = useState("catalogo");
  const [editor, setEditor] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(null);
  const [addingProposal, setAddingProposal] = useState(false);
  const defaultProposalMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); })();
  const [proposalForm, setProposalForm] = useState({ title: "", author: "", genre: "", cover_url: "", description: "", proposed_month: defaultProposalMonth });
  const [savingProposal, setSavingProposal] = useState(false);

  const handleSave = () => onReload();

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminare questo libro?")) return;
    try {
      await axios.delete(`${API}/admin/books/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Libro eliminato.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Eliminare questa recensione?")) return;
    try {
      await axios.delete(`${API}/admin/reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Recensione eliminata.");
      onReload();
    } catch (err) {
      console.error("Delete review error:", err?.response?.status, err?.response?.data);
      const msg = err?.response?.data?.detail || err?.message || "Errore nell'eliminazione.";
      toast.error(msg);
    }
  };

  const reviewsByBook = useMemo(() => {
    const map = {};
    (reviews || []).forEach(r => {
      if (!map[r.book_id]) map[r.book_id] = [];
      map[r.book_id].push(r);
    });
    return map;
  }, [reviews]);

  const lentCount = books.filter(b => b.is_lent).length;
  const proposalCount = proposals?.length || 0;

  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Eliminare questa proposta?")) return;
    try {
      await axios.delete(`${API}/admin/proposals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Proposta eliminata.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const handleAddProposal = async (e) => {
    e.preventDefault();
    if (!proposalForm.title.trim() || !proposalForm.author.trim()) { toast.error("Titolo e autore sono obbligatori."); return; }
    setSavingProposal(true);
    try {
      await axios.post(`${API}/proposals`, {
        title: proposalForm.title.trim(),
        author: proposalForm.author.trim(),
        genre: proposalForm.genre || null,
        cover_url: proposalForm.cover_url.trim() || null,
        description: proposalForm.description.trim() || null,
        proposed_month: proposalForm.proposed_month || defaultProposalMonth,
      });
      toast.success("Proposta aggiunta.");
      setProposalForm({ title: "", author: "", genre: "", cover_url: "", description: "", proposed_month: defaultProposalMonth });
      setAddingProposal(false);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSavingProposal(false); }
  };

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setSubTab(key)}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${
        subTab === key ? "bg-tv-green-deep text-tv-cream" : "text-tv-green-deep/60 hover:bg-tv-green-deep/8"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${subTab === key ? "bg-tv-cream/20" : "bg-tv-green-deep/10"}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display font-black text-2xl text-tv-green-deep">Club del Libro</h2>
        {subTab === "catalogo" && (
          <button
            onClick={() => setEditor(BOOK_EMPTY)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green transition-colors"
          >
            <Plus size={16} /> Aggiungi libro
          </button>
        )}
      </div>

      {/* Sub-tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-tv-green-deep/5 rounded-2xl w-fit flex-wrap">
        {tabBtn("catalogo", "Catalogo libri", 0)}
        {tabBtn("prestiti", "Prestiti", lentCount)}
        {tabBtn("proposte", "Proposte", proposalCount)}
      </div>

      {/* ── Catalogo ── */}
      {subTab === "catalogo" && (
        books.length === 0 ? (
          <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
            Nessun libro ancora. Aggiungine uno!
          </div>
        ) : (
          <div className="grid gap-4">
            {books.filter(b => !b.is_lent && !b.is_library_book).map(book => {
              const st = STATUS_LABELS[book.status] || STATUS_LABELS.prossimamente;
              const linkedEvents = (book.linked_event_ids || [])
                .map(id => events.find(e => e.id === id)?.title).filter(Boolean);
              const bookReviews = reviewsByBook[book.id] || [];
              return (
                <div key={book.id} className="bg-white rounded-3xl border border-tv-green-deep/10 overflow-hidden">
                  <div className="flex gap-4 p-5">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded-2xl shrink-0" />
                    ) : (
                      <div className="w-16 h-24 rounded-2xl bg-tv-green-deep/10 flex items-center justify-center shrink-0">
                        <BookOpen size={24} className="text-tv-green-deep/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-display font-black text-lg text-tv-green-deep leading-tight">{book.title}</h3>
                          <div className="text-sm text-tv-green-deep/60">{book.author}{book.genre ? ` · ${book.genre}` : ""}</div>
                          {book.reading_month && <div className="text-xs text-tv-green-deep/40 mt-0.5">📅 {book.reading_month}</div>}
                        </div>
                        <div className="flex flex-wrap items-start gap-1 justify-end shrink-0">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                          {book.in_biblioteca && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-tv-sky/30 text-tv-green-deep">
                              🏛 In sede
                            </span>
                          )}
                          {book.is_lent && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-tv-bordeaux/15 text-tv-bordeaux">
                              📤 In prestito
                            </span>
                          )}
                        </div>
                      </div>
                      {book.description && (
                        <p className="mt-2 text-sm text-tv-green-deep/65 line-clamp-2">{book.description}</p>
                      )}
                      {linkedEvents.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {linkedEvents.map(t => (
                            <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tv-sky/30 text-tv-green-deep">📅 {t}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <button onClick={() => setEditor(book)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-xs hover:bg-tv-green-deep/5">
                          <Pencil size={11} /> Modifica
                        </button>
                        <button onClick={() => handleDelete(book.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tv-bordeaux/20 text-tv-bordeaux font-bold text-xs hover:bg-tv-bordeaux/5">
                          <Trash2 size={11} /> Elimina
                        </button>
                        {bookReviews.length > 0 && (
                          <button
                            onClick={() => setExpandedReviews(expandedReviews === book.id ? null : book.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tv-sky/40 text-tv-green-deep font-bold text-xs hover:bg-tv-sky/10"
                          >
                            💬 {bookReviews.length} recension{bookReviews.length === 1 ? "e" : "i"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedReviews === book.id && (
                    <div className="border-t border-tv-green-deep/8 px-5 py-4 bg-tv-sky/10 flex flex-col gap-3">
                      {bookReviews.map(r => (
                        <div key={r.id} className="flex items-start justify-between gap-3 bg-white rounded-2xl p-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-tv-green-deep">{r.reviewer_name}</div>
                            <div className="text-xs text-tv-green-deep/50 mt-0.5">{fmtDate(r.created_at)}</div>
                            <p className="text-sm text-tv-green-deep/75 mt-1 leading-snug">{r.content}</p>
                          </div>
                          <button onClick={() => handleDeleteReview(r.id)} className="p-1.5 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Prestiti ── */}
      {subTab === "prestiti" && (
        <LoanManager books={books} token={token} onReload={onReload} />
      )}

      {/* ── Proposte ── */}
      {subTab === "proposte" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-black text-xl text-tv-green-deep">Proposte dei lettori</h3>
            <button
              onClick={() => setAddingProposal(a => !a)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors"
            >
              <Plus size={15} /> Aggiungi proposta
            </button>
          </div>
          {addingProposal && (
            <form onSubmit={handleAddProposal} className="rounded-2xl border border-tv-orange/20 bg-tv-orange/5 p-5 grid gap-4 mb-5">
              <div className="text-sm font-black text-tv-orange uppercase tracking-wider">Nuova proposta</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Titolo *</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.title} onChange={e => setProposalForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Autore *</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.author} onChange={e => setProposalForm(f => ({ ...f, author: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Genere</label>
                <select className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.genre} onChange={e => setProposalForm(f => ({ ...f, genre: e.target.value }))}>
                  <option value="">— Seleziona un genere —</option>
                  {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">URL copertina</label>
                <input className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.cover_url} onChange={e => setProposalForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Descrizione / trama</label>
                <textarea className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm resize-none" rows={3} value={proposalForm.description} onChange={e => setProposalForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Mese di riferimento *</label>
                <input type="month" className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.proposed_month} onChange={e => setProposalForm(f => ({ ...f, proposed_month: e.target.value }))} required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAddingProposal(false)} className="px-4 py-2.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
                <button type="submit" disabled={savingProposal} className="px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm disabled:opacity-60">{savingProposal ? "Salvo…" : "Aggiungi proposta"}</button>
              </div>
            </form>
          )}
          {(proposals || []).length === 0 ? (
            <div className="rounded-2xl bg-white border border-tv-green-deep/10 p-8 text-center text-tv-green-deep/40">
              Nessuna proposta ancora.
            </div>
          ) : (
            <div className="grid gap-3">
              {[...(proposals || [])].sort((a, b) => b.votes - a.votes).map(p => (
                <ProposalAdminCard key={p.id} p={p} onDelete={handleDeleteProposal} onReload={onReload} token={token} />
              ))}
            </div>
          )}
        </div>
      )}

      {editor !== null && (
        <BookEditor
          book={editor}
          events={events}
          token={token}
          onSave={handleSave}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
};

// ── CineforumManager con sub-tab ─────────────────────────────────────────────
const CineforumManager = ({ films, events, filmReviews, filmProposals, token, onReload }) => {
  const [subTab, setSubTab] = useState("catalogo");
  const [editor, setEditor] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState(null);
  const [addingProposal, setAddingProposal] = useState(false);
  const defaultFilmProposalMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); })();
  const [proposalForm, setProposalForm] = useState({ title: "", director: "", genre: "", cover_url: "", description: "", proposed_month: defaultFilmProposalMonth });
  const [savingProposal, setSavingProposal] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminare questo film?")) return;
    try {
      await axios.delete(`${API}/admin/films/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Film eliminato.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Eliminare questa recensione?")) return;
    try {
      await axios.delete(`${API}/admin/film-reviews/${reviewId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Recensione eliminata.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const reviewsByFilm = useMemo(() => {
    const map = {};
    (filmReviews || []).forEach(r => {
      if (!map[r.film_id]) map[r.film_id] = [];
      map[r.film_id].push(r);
    });
    return map;
  }, [filmReviews]);

  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Eliminare questa proposta?")) return;
    try {
      await axios.delete(`${API}/admin/film-proposals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Proposta eliminata.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const handleAddProposal = async (e) => {
    e.preventDefault();
    if (!proposalForm.title.trim() || !proposalForm.director.trim()) { toast.error("Titolo e regista sono obbligatori."); return; }
    setSavingProposal(true);
    try {
      await axios.post(`${API}/film-proposals`, {
        title: proposalForm.title.trim(),
        director: proposalForm.director.trim(),
        genre: proposalForm.genre || null,
        cover_url: proposalForm.cover_url.trim() || null,
        description: proposalForm.description.trim() || null,
        proposed_month: proposalForm.proposed_month || defaultFilmProposalMonth,
      });
      toast.success("Proposta aggiunta.");
      setProposalForm({ title: "", director: "", genre: "", cover_url: "", description: "", proposed_month: defaultFilmProposalMonth });
      setAddingProposal(false);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSavingProposal(false); }
  };

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => setSubTab(key)}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5 ${
        subTab === key ? "bg-tv-sky text-white" : "text-tv-green-deep/60 hover:bg-tv-sky/10"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${subTab === key ? "bg-white/20" : "bg-tv-sky/15"}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="font-display font-black text-2xl text-tv-green-deep">Cineforum</h2>
        {subTab === "catalogo" && (
          <button
            onClick={() => setEditor(FILM_EMPTY)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-sky text-white font-bold text-sm hover:bg-tv-sky/80 transition-colors"
          >
            <Plus size={16} /> Aggiungi film
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-tv-sky/5 rounded-2xl w-fit flex-wrap">
        {tabBtn("catalogo", "Catalogo film", 0)}
        {tabBtn("proposte", "Proposte", filmProposals?.length || 0)}
      </div>

      {/* ── Catalogo ── */}
      {subTab === "catalogo" && (
        films.length === 0 ? (
          <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
            Nessun film ancora. Aggiungine uno!
          </div>
        ) : (
          <div className="grid gap-4">
            {films.map(film => {
              const st = FILM_STATUS_LABELS[film.status] || FILM_STATUS_LABELS.prossimamente;
              const filmReviewsList = reviewsByFilm[film.id] || [];
              return (
                <div key={film.id} className="bg-white rounded-3xl border border-tv-green-deep/10 overflow-hidden">
                  <div className="flex gap-4 p-5">
                    {film.cover_url ? (
                      <img src={film.cover_url} alt={film.title} className="w-16 h-24 object-cover rounded-2xl shrink-0" />
                    ) : (
                      <div className="w-16 h-24 rounded-2xl bg-tv-sky/10 flex items-center justify-center shrink-0">
                        <Film size={24} className="text-tv-sky/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-display font-black text-lg text-tv-green-deep leading-tight">{film.title}</h3>
                          <div className="text-sm text-tv-green-deep/60">
                            {film.director}{film.genre ? ` · ${film.genre}` : ""}
                            {film.year ? ` · ${film.year}` : ""}
                            {film.duration ? ` · ${film.duration} min` : ""}
                          </div>
                          {film.screening_month && <div className="text-xs text-tv-green-deep/40 mt-0.5">📅 {film.screening_month}</div>}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      {film.description && (
                        <p className="mt-2 text-sm text-tv-green-deep/65 line-clamp-2">{film.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <button onClick={() => setEditor(film)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-xs hover:bg-tv-green-deep/5">
                          <Pencil size={11} /> Modifica
                        </button>
                        <button onClick={() => handleDelete(film.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tv-bordeaux/20 text-tv-bordeaux font-bold text-xs hover:bg-tv-bordeaux/5">
                          <Trash2 size={11} /> Elimina
                        </button>
                        {filmReviewsList.length > 0 && (
                          <button
                            onClick={() => setExpandedReviews(expandedReviews === film.id ? null : film.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-tv-sky/40 text-tv-green-deep font-bold text-xs hover:bg-tv-sky/10"
                          >
                            💬 {filmReviewsList.length} recension{filmReviewsList.length === 1 ? "e" : "i"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedReviews === film.id && (
                    <div className="border-t border-tv-green-deep/8 px-5 py-4 bg-tv-sky/5 flex flex-col gap-3">
                      {filmReviewsList.map(r => (
                        <div key={r.id} className="flex items-start justify-between gap-3 bg-white rounded-2xl p-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-tv-green-deep">{r.reviewer_name}</div>
                            <div className="text-xs text-tv-green-deep/50 mt-0.5">{fmtDate(r.created_at)}</div>
                            <p className="text-sm text-tv-green-deep/75 mt-1 leading-snug">{r.content}</p>
                          </div>
                          <button onClick={() => handleDeleteReview(r.id)} className="p-1.5 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Proposte ── */}
      {subTab === "proposte" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-black text-xl text-tv-green-deep">Proposte dei cinefili</h3>
            <button
              onClick={() => setAddingProposal(a => !a)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm hover:bg-tv-orange/80 transition-colors"
            >
              <Plus size={15} /> Aggiungi proposta
            </button>
          </div>
          {addingProposal && (
            <form onSubmit={handleAddProposal} className="rounded-2xl border border-tv-orange/20 bg-tv-orange/5 p-5 grid gap-4 mb-5">
              <div className="text-sm font-black text-tv-orange uppercase tracking-wider">Nuova proposta</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Titolo *</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.title} onChange={e => setProposalForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Regista *</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.director} onChange={e => setProposalForm(f => ({ ...f, director: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Genere</label>
                <select className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.genre} onChange={e => setProposalForm(f => ({ ...f, genre: e.target.value }))}>
                  <option value="">— Seleziona un genere —</option>
                  {FILM_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">URL locandina</label>
                <input className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm" value={proposalForm.cover_url} onChange={e => setProposalForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Descrizione / trama</label>
                <textarea className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm resize-none" rows={3} value={proposalForm.description} onChange={e => setProposalForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Mese di riferimento *</label>
                <input type="month" className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-sky outline-none text-tv-green-deep text-sm" value={proposalForm.proposed_month} onChange={e => setProposalForm(f => ({ ...f, proposed_month: e.target.value }))} required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAddingProposal(false)} className="px-4 py-2.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
                <button type="submit" disabled={savingProposal} className="px-5 py-2.5 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm disabled:opacity-60">{savingProposal ? "Salvo…" : "Aggiungi proposta"}</button>
              </div>
            </form>
          )}
          {(filmProposals || []).length === 0 ? (
            <div className="rounded-2xl bg-white border border-tv-green-deep/10 p-8 text-center text-tv-green-deep/40">
              Nessuna proposta ancora.
            </div>
          ) : (
            <div className="grid gap-3">
              {[...(filmProposals || [])].sort((a, b) => b.votes - a.votes).map(p => (
                <FilmProposalAdminCard key={p.id} p={p} onDelete={handleDeleteProposal} onReload={onReload} token={token} />
              ))}
            </div>
          )}
        </div>
      )}

      {editor !== null && (
        <FilmEditor
          film={editor}
          events={events}
          token={token}
          onSave={() => onReload()}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
};

const DashboardHome = ({ data, onNavigate }) => {
  const upcomingEvents = data.events.filter(e => !isPast(e.date)).length;
  const confirmedPeople = data["event-signups"].filter(s => s.confirmed).reduce((s, r) => s + (r.num_persone || 1), 0);
  const upcomingEventIds = new Set(data.events.filter(e => !isPast(e.date)).map(e => e.id));
  const toConfirmPeople = data["event-signups"].filter(s => !s.confirmed && upcomingEventIds.has(s.event_id)).reduce((s, r) => s + (r.num_persone || 1), 0);
  const pendingRegistrations = data.registrations.filter(r => r.status !== "approved" && r.status !== "archived").length;
  const numberedMembers = data.members.filter(m => m.tessera_number).length;
  const unreadContacts = data.contacts.length;

  const kpis = [
    { label: "Soci tesserati",       value: numberedMembers,    icon: IdCard,        iconBg: "bg-tv-green/20",    iconColor: "text-tv-green",      targetTab: "members" },
    { label: "Iscrizioni in attesa", value: pendingRegistrations, icon: Users,       iconBg: "bg-tv-orange/20",   iconColor: "text-tv-orange",     targetTab: "registrations" },
    { label: "Da confermare",        value: toConfirmPeople,    icon: Calendar,      iconBg: "bg-tv-sky/30",      iconColor: "text-tv-sky",        targetTab: "event-signups" },
    { label: "Presenze confermate",  value: confirmedPeople,    icon: UserCheck,     iconBg: "bg-tv-mint/50",     iconColor: "text-tv-green-deep", targetTab: "event-signups" },
    { label: "Eventi in programma",  value: upcomingEvents,     icon: CalendarPlus,  iconBg: "bg-tv-bordeaux/10", iconColor: "text-tv-bordeaux",   targetTab: "events" },
    { label: "Messaggi ricevuti",    value: unreadContacts,     icon: MessageSquare, iconBg: "bg-amber-100",      iconColor: "text-amber-600",     targetTab: "contacts" },
  ];

  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-tv-green-deep/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50">{kpi.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                <kpi.icon size={18} className={kpi.iconColor} />
              </div>
            </div>
            <div className="font-display font-black text-3xl text-tv-green-deep">{kpi.value}</div>
            <button onClick={() => onNavigate(kpi.targetTab)} className="text-xs text-tv-green-deep/40 hover:text-tv-green-deep font-bold text-left transition-colors">
              Vedi dettagli →
            </button>
          </div>
        ))}
      </div>

      {/* Middle section — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Prossimi eventi */}
        <div className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
          <div className="p-5 border-b border-tv-green-deep/10 flex items-center justify-between">
            <h3 className="font-display font-black text-lg text-tv-green-deep">Prossimi eventi</h3>
            <button onClick={() => onNavigate("events")} className="text-xs font-bold text-tv-green-deep/40 hover:text-tv-green-deep">Gestisci →</button>
          </div>
          <div className="divide-y divide-tv-green-deep/5">
            {data.events.filter(e => !isPast(e.date)).slice(0, 5).map(ev => {
              const signupsForEvent = data["event-signups"].filter(s => s.event_id === ev.id);
              const totalBooked = signupsForEvent.reduce((s, r) => s + (r.num_persone || 1), 0);
              const fillPct = ev.spots > 0 ? Math.max(0, Math.min(100, (totalBooked / (totalBooked + ev.spots)) * 100)) : 100;
              return (
                <div key={ev.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-sm text-tv-green-deep leading-tight">{ev.title}</div>
                      <div className="text-xs text-tv-green-deep/50 mt-0.5">
                        {new Date(ev.date).toLocaleDateString("it-IT", { day: "numeric", month: "short" })} · {ev.time}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-tv-green-deep/60 shrink-0">{ev.spots} posti</span>
                  </div>
                  <div className="h-1.5 bg-tv-green-deep/10 rounded-full overflow-hidden">
                    <div style={{ width: `${fillPct}%` }} className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-tv-bordeaux" : fillPct >= 60 ? "bg-tv-orange" : "bg-tv-green"}`} />
                  </div>
                </div>
              );
            })}
            {data.events.filter(e => !isPast(e.date)).length === 0 && (
              <div className="p-8 text-center text-tv-green-deep/40 text-sm">Nessun evento in programma</div>
            )}
          </div>
        </div>

        {/* Ultime richieste eventi */}
        <div className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
          <div className="p-5 border-b border-tv-green-deep/10 flex items-center justify-between">
            <h3 className="font-display font-black text-lg text-tv-green-deep">Ultime richieste eventi</h3>
            <button onClick={() => onNavigate("event-signups")} className="text-xs font-bold text-tv-green-deep/40 hover:text-tv-green-deep">Vedi tutte →</button>
          </div>
          <div className="divide-y divide-tv-green-deep/5">
            {[...data["event-signups"]].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6).map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${s.confirmed ? "bg-tv-green/20 text-tv-green-deep" : "bg-tv-orange/20 text-tv-orange"}`}>
                  {s.confirmed ? "✓" : "…"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-tv-green-deep truncate">{s.name}</div>
                  <div className="text-xs text-tv-green-deep/50 truncate">{s.event_title}</div>
                </div>
                {(s.num_persone || 1) > 1 && (
                  <span className="text-xs font-bold text-tv-sky bg-tv-sky/20 px-2 py-0.5 rounded-full shrink-0">×{s.num_persone}</span>
                )}
              </div>
            ))}
            {data["event-signups"].length === 0 && (
              <div className="p-8 text-center text-tv-green-deep/40 text-sm">Nessuna richiesta</div>
            )}
          </div>
        </div>

        {/* Iscrizioni in attesa */}
        <div className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
          <div className="p-5 border-b border-tv-green-deep/10 flex items-center justify-between">
            <h3 className="font-display font-black text-lg text-tv-green-deep">Iscrizioni in attesa</h3>
            <button onClick={() => onNavigate("registrations")} className="text-xs font-bold text-tv-green-deep/40 hover:text-tv-green-deep">Gestisci →</button>
          </div>
          <div className="divide-y divide-tv-green-deep/5">
            {data.registrations.filter(r => r.status !== "approved" && r.status !== "archived").slice(0, 6).map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-tv-orange/10 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-tv-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-tv-green-deep truncate">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-tv-green-deep/50">
                    {new Date(r.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    {r.document_downloaded && " · 📥 PDF"}
                    {r.tessera_number && ` · 🎫 #${r.tessera_number}`}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${r.payment_completed ? "bg-tv-green/20 text-tv-green-deep" : "bg-tv-orange/20 text-tv-orange"}`}>
                  {r.payment_completed ? "Pagato" : r.metodo_pagamento || "In attesa"}
                </span>
              </div>
            ))}
            {data.registrations.filter(r => r.status !== "approved" && r.status !== "archived").length === 0 && (
              <div className="p-8 text-center text-tv-green-deep/40 text-sm">Nessuna iscrizione in attesa 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section — charts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Partecipazione per evento */}
        <div className="bg-white rounded-2xl border border-tv-green-deep/10 p-6">
          <h3 className="font-display font-black text-lg text-tv-green-deep mb-5">Partecipazione per evento</h3>
          {(() => {
            const eventTitleById = Object.fromEntries(data.events.map(e => [e.id, e.title]));
            const byEvent = {};
            data["event-signups"].filter(s => eventTitleById[s.event_id]).forEach(s => {
              const k = eventTitleById[s.event_id];
              byEvent[k] = (byEvent[k] || 0) + (s.num_persone || 1);
            });
            const sorted = Object.entries(byEvent).sort((a, b) => b[1] - a[1]).slice(0, 6);
            const max = sorted[0]?.[1] || 1;
            return sorted.length === 0 ? (
              <div className="text-tv-green-deep/40 text-sm text-center py-8">Nessun dato disponibile</div>
            ) : (
              <div className="space-y-4">
                {sorted.map(([title, count]) => (
                  <div key={title}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-tv-green-deep font-semibold truncate flex-1 mr-3" title={title}>
                        {title.length > 30 ? title.slice(0, 30) + "…" : title}
                      </span>
                      <span className="font-black text-tv-green-deep shrink-0">{count}</span>
                    </div>
                    <div className="h-2.5 bg-tv-green-deep/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(count / max) * 100}%` }}
                        className="h-full bg-tv-green rounded-full transition-all duration-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right: Composizione soci + Messaggi recenti */}
        <div className="space-y-6">
          {/* Composizione soci */}
          <div className="bg-white rounded-2xl border border-tv-green-deep/10 p-6">
            <h3 className="font-display font-black text-lg text-tv-green-deep mb-4">Composizione soci</h3>
            {(() => {
              const tesserati = data.members.filter(m => m.tessera_number).length;
              const fondatori = data.members.filter(m => !m.tessera_number).length;
              const inAttesa = data.registrations.filter(r => r.status !== "approved" && r.status !== "archived").length;
              const total = tesserati + fondatori + inAttesa || 1;
              const bars = [
                { label: "Soci tesserati", count: tesserati, color: "bg-tv-green" },
                { label: "Soci fondatori", count: fondatori, color: "bg-amber-400" },
                { label: "In attesa",      count: inAttesa,  color: "bg-tv-orange" },
              ];
              return (
                <div className="space-y-3">
                  {bars.map(b => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className="w-28 text-xs font-bold text-tv-green-deep/60 shrink-0">{b.label}</div>
                      <div className="flex-1 h-3 bg-tv-green-deep/10 rounded-full overflow-hidden">
                        <div style={{ width: `${(b.count / total) * 100}%` }} className={`h-full ${b.color} rounded-full`} />
                      </div>
                      <div className="w-6 text-xs font-black text-tv-green-deep text-right">{b.count}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Messaggi recenti */}
          <div className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden">
            <div className="p-5 border-b border-tv-green-deep/10 flex items-center justify-between">
              <h3 className="font-display font-black text-lg text-tv-green-deep">Messaggi recenti</h3>
              <button onClick={() => onNavigate("contacts")} className="text-xs font-bold text-tv-green-deep/40 hover:text-tv-green-deep">Vedi tutti →</button>
            </div>
            <div className="divide-y divide-tv-green-deep/5">
              {data.contacts.slice(0, 3).map(c => (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-tv-green-deep">{c.name || c.first_name || "—"}</span>
                    <span className="text-[10px] text-tv-green-deep/40">{new Date(c.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="text-xs text-tv-green-deep/60 line-clamp-2">{c.message || c.body || "—"}</p>
                </div>
              ))}
              {data.contacts.length === 0 && (
                <div className="p-6 text-center text-tv-green-deep/40 text-sm">Nessun messaggio</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ token, onLogout }) => {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState({
    registrations: [], "event-signups": [], contacts: [], events: [], members: [], books: [], reviews: [], proposals: [],
    films: [], "film-reviews": [], "film-proposals": [],
  });
  const [loading, setLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [eventEditor, setEventEditor] = useState(null);
  const [memberEditor, setMemberEditor] = useState(null);
  const [tesseraModal, setTesseraModal] = useState(null);
  const [tesseraInput, setTesseraInput] = useState("");
  const [tesseraLoading, setTesseraLoading] = useState(false);

  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadAll = async () => {
    if (!token) {
      setLoading(false);
      if (typeof onLogout === "function") onLogout();
      return;
    }

    setLoading(true);
    try {
      const [r, es, c, ev, mem, bk, rv, pr, mis, don, fl, frv, fpr] = await Promise.all([
        axios.get(`${API}/admin/registrations`, authHeader),
        axios.get(`${API}/admin/event-signups`, authHeader),
        axios.get(`${API}/admin/contacts`, authHeader),
        axios.get(`${API}/admin/events`, authHeader),
        axios.get(`${API}/admin/members`, authHeader),
        axios.get(`${API}/books`, authHeader),
        axios.get(`${API}/admin/reviews`, authHeader),
        axios.get(`${API}/admin/proposals`, authHeader),
        axios.get(`${API}/admin/missions`, authHeader),
        axios.get(`${API}/admin/donations`, authHeader),
        axios.get(`${API}/films`, authHeader),
        axios.get(`${API}/admin/film-reviews`, authHeader),
        axios.get(`${API}/admin/film-proposals`, authHeader),
      ]);
      setData({
        registrations: r.data || [],
        "event-signups": es.data || [],
        contacts: c.data || [],
        events: ev.data || [],
        members: mem.data || [],
        books: bk.data || [],
        reviews: rv.data || [],
        proposals: pr.data || [],
        missions: mis.data || [],
        donations: don.data || [],
        films: fl.data || [],
        "film-reviews": frv.data || [],
        "film-proposals": fpr.data || [],
      });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Sessione scaduta, rifai login.");
        localStorage.removeItem(TOKEN_KEY);
        if (typeof onLogout === "function") onLogout();
      } else {
        toast.error(`Errore nel recupero dati: ${err.message || "Problema di connessione"}`);
      }
    } finally {
      // Viene eseguito sempre, impedendo il blocco infinito dell'interfaccia
      setLoading(false);
    }
  };

  // Esegue l'inizializzazione controllata evitando loop infiniti reattivi
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (collection, id) => {
    if (!window.confirm("Sei sicuro di voler eliminare?")) return;
    try {
      await axios.delete(`${API}/admin/${collection}/${id}`, authHeader);
      toast.success("Eliminato.");
      setData({ ...data, [collection]: data[collection].filter((d) => d.id !== id) });
    } catch { toast.error("Errore nell'eliminazione."); }
  };

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const sheets = [
      ["Soci tesserati", data.members],
      ["Richieste iscrizione", data.registrations],
      ["Richieste eventi", data["event-signups"]],
      ["Messaggi contatti", data.contacts],
      ["Eventi", data.events],
    ];
    let any = false;
    for (const [name, rows] of sheets) {
      if (!rows || rows.length === 0) continue;
      any = true;
      const ws = XLSX.utils.json_to_sheet(rows);
      const cols = Object.keys(rows[0] || {}).map((k) => ({
        wch: Math.min(Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2, 50),
      }));
      ws["!cols"] = cols;
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    }
    if (!any) return toast.error("Nessun dato da esportare.");
    const fileName = `tramaviva-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Export Excel scaricato!");
  };

  const openTesseraModal = (id) => {
    const row = data.registrations.find(r => r.id === id);
    if (!row) return;
    setTesseraInput(row.tessera_number || "");
    setTesseraModal(row);
  };

  const confirmTesseraAndDownload = async () => {
    if (!tesseraModal) return;
    const row = tesseraModal;
    setTesseraLoading(true);
    try {
      if (tesseraInput.trim()) {
        await axios.patch(`${API}/admin/registrations/${row.id}/tessera`,
          { tessera_number: tesseraInput.trim() },
          authHeader
        );
        setData(prev => ({
          ...prev,
          registrations: prev.registrations.map(r =>
            r.id === row.id ? { ...r, tessera_number: tesseraInput.trim() } : r
          ),
        }));
      }
      setTesseraModal(null);
      await downloadPdf(row.id);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Errore nell'assegnazione del numero tessera.";
      toast.error(msg);
    } finally {
      setTesseraLoading(false);
    }
  };

  const downloadPdf = async (registrationId) => {
    setPdfLoadingId(registrationId);
    try {
      const response = await axios.get(`${API}/admin/registrations/${registrationId}/pdf`, authHeader);
      const { pdf_base64, filename } = response.data;

      if (!pdf_base64) {
        toast.error("File PDF non trovato.");
        return;
      }

      // Blob URL approach: funziona su desktop e su iOS Safari
      const bytes = atob(pdf_base64);
      const byteArray = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) byteArray[i] = bytes.charCodeAt(i);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || `iscrizione_${registrationId}.pdf`;
      link.target = "_blank"; // fallback iOS: apre in nuova scheda
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);

      toast.success("PDF aperto! Su iPhone usa il tasto Condividi per salvarlo.");
      // Aggiorna solo il flag document_downloaded senza ricaricare tutto
      setData(prev => ({
        ...prev,
        registrations: prev.registrations.map(r =>
          r.id === registrationId ? { ...r, document_downloaded: true } : r
        ),
      }));
    } catch (err) {
      toast.error("Errore nel recupero del file PDF.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const promoteToMember = async (req) => {
    if (!window.confirm(`Vuoi approvare la richiesta di ${req.first_name} ${req.last_name} e promuoverlo a socio?`)) return;
    try {
      await axios.post(`${API}/admin/registrations/${req.id}/approve`, {}, authHeader);
      toast.success("Richiesta approvata e aggiunta al registro dei soci!");
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore durante l'approvazione");
    }
  };

  const togglePayment = async (row) => {
    const newValue = !row.payment_completed;
    try {
      await axios.patch(`${API}/admin/registrations/${row.id}/payment-status`, { payment_completed: newValue }, authHeader);
      toast.success(newValue ? "Pagamento segnato come ricevuto!" : "Pagamento segnato come da ricevere.");
      loadAll();
    } catch { toast.error("Errore nell'aggiornamento del pagamento."); }
  };

  const toggleEventPayment = async (row) => {
    const newValue = !row.payment_completed;
    try {
      await axios.patch(`${API}/admin/event-signups/${row.id}/payment-status`, { payment_completed: newValue }, authHeader);
      toast.success(newValue ? "Pagamento segnato come ricevuto!" : "Pagamento segnato come da ricevere.");
      loadAll();
    } catch { toast.error("Errore nell'aggiornamento del pagamento."); }
  };

  const resendEmail = async (row) => {
    try {
      await axios.post(`${API}/admin/registrations/${row.id}/resend-confirmation`, {}, authHeader);
      toast.success("Email di conferma reinviata!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore nel reinvio email.");
    }
  };

  const cleanupRegistration = async (row) => {
    const name = `${row.first_name || ""} ${row.last_name || ""}`.trim();
    if (!window.confirm(`Cancellare tutti i dati sensibili di ${name}?\n\nVerranno conservati solo nome, cognome, email, telefono e origine.\nIl PDF verrà eliminato dal database.\n\n⚠️ Questa azione è irreversibile.`)) return;
    try {
      await axios.post(`${API}/admin/registrations/${row.id}/cleanup`, {}, authHeader);
      toast.success("Dati sensibili cancellati.");
      setData(prev => ({
        ...prev,
        registrations: prev.registrations.map(r =>
          r.id === row.id
            ? { ...r, status: "archived", pdf_base64: null, document_deleted_at: new Date().toISOString() }
            : r
        ),
      }));
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore nella cancellazione dati.");
    }
  };

  const confirmSignup = async (row) => {
    if (!window.confirm(`Confermi la presenza di ${row.name} e scali un posto da "${row.event_title}"?`)) return;
    try {
      await axios.post(`${API}/admin/event-signups/${row.id}/confirm`, {}, authHeader);
      toast.success("Presenza confermata, posto scalato!");
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Errore nella conferma");
    }
  };
    
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clubsNavOpen, setClubsNavOpen] = useState(true);
  const list = data[tab] || [];

  return (
    <div className="flex min-h-screen bg-tv-cream">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-tv-green-deep text-tv-cream flex flex-col z-40 shadow-2xl transition-all duration-300 ease-in-out
        ${sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:-translate-x-0 md:w-16"}
      `}>
        {/* Logo area */}
        <div className={`border-b border-tv-cream/10 flex items-center ${sidebarOpen ? "p-6 gap-3" : "p-3 justify-center"}`}>
          <div className="w-10 h-10 rounded-2xl bg-tv-green flex items-center justify-center text-xl flex-shrink-0">🧵</div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-display font-black text-lg leading-tight whitespace-nowrap">Trama Viva</div>
              <div className="text-[10px] text-tv-cream/50 uppercase tracking-widest">APS · Admin</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => {
            const isClub = item.key === "books" || item.key === "cineforum";

            // Render club items: skip them here if sidebar is expanded (handled by accordion below)
            if (isClub) return null;

            const navBtn = (
              <button
                key={item.key}
                onClick={() => { setTab(item.key); setSidebarOpen(false); }}
                data-testid={`admin-tab-${item.key}`}
                title={!sidebarOpen ? item.label : undefined}
                className={`w-full flex items-center rounded-2xl text-sm font-bold transition-all
                  ${sidebarOpen ? "gap-3 px-4 py-3" : "justify-center p-3"}
                  ${tab === item.key
                    ? "bg-tv-cream/15 text-tv-cream"
                    : "text-tv-cream/60 hover:bg-tv-cream/10 hover:text-tv-cream"
                  }`}
              >
                <span className="relative flex-shrink-0">
                  <item.icon size={18} />
                  {(() => {
                    let dot = 0;
                    if (item.key === "registrations") dot = (data.registrations || []).filter(r => !r.is_member && r.status !== "approved" && r.status !== "archived").length;
                    else if (item.key === "event-signups") {
                      const futureIds = new Set((data.events || []).filter(e => !isPast(e.date)).map(e => e.id));
                      dot = (data["event-signups"] || []).filter(s => !s.confirmed && futureIds.has(s.event_id)).length;
                    }
                    else if (item.key === "contacts") dot = (data.contacts || []).length;
                    return dot > 0 ? <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-tv-bordeaux border border-tv-green-deep" /> : null;
                  })()}
                </span>
                {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
                {sidebarOpen && data[item.key] && item.key !== "home" && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    tab === item.key ? "bg-tv-cream/20 text-tv-cream" : "bg-tv-cream/10 text-tv-cream/60"
                  }`}>
                    {data[item.key]?.length ?? 0}
                  </span>
                )}
              </button>
            );

            // Inject the "I nostri Club" accordion before "missions"
            if (item.key === "missions") {
              const clubItems = NAV.filter(n => n.key === "books" || n.key === "cineforum");
              return (
                <React.Fragment key="clubs-group-and-missions">
                  {/* Accordion header */}
                  {sidebarOpen ? (
                    <button
                      onClick={() => setClubsNavOpen(o => !o)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-tv-cream/60 hover:bg-tv-cream/10 hover:text-tv-cream transition-all"
                    >
                      <BookOpen size={18} />
                      <span className="flex-1 text-left">I nostri Club</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${clubsNavOpen ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <div className="border-t border-tv-cream/10 my-1" />
                  )}

                  {/* Club sub-items */}
                  {clubItems.map(club => {
                    const isActive = tab === club.key;
                    const visible = !sidebarOpen || clubsNavOpen;
                    return (
                      <div
                        key={club.key}
                        className={`overflow-hidden transition-all duration-200 ${visible ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <button
                          onClick={() => { setTab(club.key); setSidebarOpen(false); }}
                          data-testid={`admin-tab-${club.key}`}
                          title={!sidebarOpen ? club.label : undefined}
                          className={`w-full flex items-center rounded-2xl text-sm font-bold transition-all
                            ${sidebarOpen ? "gap-3 pl-8 pr-4 py-2.5" : "justify-center p-3"}
                            ${isActive
                              ? "bg-tv-cream/15 text-tv-cream"
                              : "text-tv-cream/60 hover:bg-tv-cream/10 hover:text-tv-cream"
                            }`}
                        >
                          <club.icon size={16} />
                          {sidebarOpen && <span className="flex-1 text-left">{club.label}</span>}
                          {sidebarOpen && data[club.key] && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? "bg-tv-cream/20 text-tv-cream" : "bg-tv-cream/10 text-tv-cream/60"
                            }`}>
                              {data[club.key]?.length ?? 0}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {/* Divider after club group in icon mode */}
                  {!sidebarOpen && <div className="border-t border-tv-cream/10 my-1" />}

                  {/* Then render "missions" button */}
                  {navBtn}
                </React.Fragment>
              );
            }

            return navBtn;
          })}
        </nav>

        {/* Bottom actions */}
        <div className={`border-t border-tv-cream/10 space-y-2 ${sidebarOpen ? "p-4" : "p-3"}`}>
          <button
            onClick={exportXlsx}
            data-testid="admin-export-xlsx"
            title={!sidebarOpen ? "Esporta XLSX" : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-bold text-tv-cream/70 hover:bg-tv-cream/10 hover:text-tv-cream transition-all
              ${sidebarOpen ? "gap-2 px-3 py-2" : "justify-center p-3"}`}
          >
            <Download size={15} />
            {sidebarOpen && "Esporta tutto XLSX"}
          </button>
          <button
            onClick={onLogout}
            data-testid="admin-logout"
            title={!sidebarOpen ? "Esci" : undefined}
            className={`w-full flex items-center rounded-xl text-xs font-bold text-tv-cream/70 hover:bg-tv-bordeaux/30 hover:text-tv-cream transition-all
              ${sidebarOpen ? "gap-2 px-3 py-2" : "justify-center p-3"}`}
          >
            <LogOut size={15} />
            {sidebarOpen && "Esci"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? "md:ml-64" : "md:ml-16"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-tv-cream/90 backdrop-blur-sm border-b border-tv-green-deep/10 px-4 md:px-8 py-4 flex items-center gap-3">
          {/* Toggle sidebar button */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-xl hover:bg-tv-green-deep/10 text-tv-green-deep/50 hover:text-tv-green-deep transition-colors flex-shrink-0"
            title={sidebarOpen ? "Chiudi menu" : "Apri menu"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-xl md:text-2xl text-tv-green-deep truncate">
              {NAV.find(n => n.key === tab)?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-tv-green-deep/50 mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {loading && <Loader2 size={18} className="animate-spin text-tv-green-deep/40" />}
            <button
              onClick={loadAll}
              className="p-2 rounded-xl hover:bg-tv-green-deep/10 text-tv-green-deep/50 hover:text-tv-green-deep transition-colors"
              title="Aggiorna dati"
            >
              <RefreshCw size={16} />
            </button>
            <div className="w-9 h-9 rounded-2xl bg-tv-green-deep flex items-center justify-center text-tv-cream font-black text-sm">A</div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 md:p-8">
          {tab === "home" ? (
            <DashboardHome data={data} onNavigate={setTab} />
          ) : loading ? (
            <div className="text-tv-green-deep/60 flex items-center gap-2 font-bold" data-testid="admin-loading">
              <Loader2 className="animate-spin" size={18} /> Caricamento in corso...
            </div>
          ) : tab === "events" ? (
            <EventsManager
              events={data.events}
              onCreate={() => setEventEditor("new")}
              onEdit={(ev) => setEventEditor(ev)}
              onDelete={(id) => remove("events", id)}
            />
          ) : tab === "books" ? (
            <BookManager
              books={data.books}
              events={data.events}
              reviews={data.reviews}
              proposals={data.proposals}
              token={token}
              onReload={loadAll}
            />
          ) : tab === "cineforum" ? (
            <CineforumManager
              films={data.films || []}
              events={data.events || []}
              filmReviews={data["film-reviews"] || []}
              filmProposals={data["film-proposals"] || []}
              token={token}
              onReload={loadAll}
            />
          ) : tab === "missions" ? (
            <MissionsManager
              missions={data.missions || []}
              events={data.events || []}
              token={token}
              onReload={loadAll}
            />
          ) : tab === "donations" ? (
            <DonationsManager
              donations={data.donations || []}
              token={token}
              onReload={loadAll}
            />
          ) : tab === "members" ? (
            <MembersManager
              members={data.members}
              registrations={data.registrations}
              onEdit={(m) => setMemberEditor(m)}
              onDelete={(id) => remove("members", id)}
            />
          ) : tab === "registrations" ? (
            <RegistrationsManager
              list={list}
              onPdf={openTesseraModal}
              pdfLoadingId={pdfLoadingId}
              onTogglePayment={togglePayment}
              onApprove={promoteToMember}
              onCleanup={cleanupRegistration}
              onResend={resendEmail}
              onDelete={(id) => remove("registrations", id)}
            />
          ) : tab === "event-signups" ? (
            <EventSignupsManager
              signups={data["event-signups"]}
              members={data.members}
              events={data.events}
              onConfirm={confirmSignup}
              onDelete={(id) => remove("event-signups", id)}
              onTogglePayment={toggleEventPayment}
              token={token}
              onReload={loadAll}
            />
          ) : list.length === 0 ? (
            <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60" data-testid="admin-empty">
              Ancora niente qui. Quando qualcuno invierà un modulo, lo vedrai apparire.
            </div>
          ) : (
            <div className="grid gap-4" data-testid="admin-list">
              {list.map((row) => (
                <article
                  key={row.id}
                  className="bg-white rounded-3xl p-5 md:p-6 border border-tv-green-deep/10 flex flex-col md:flex-row md:items-center gap-4 justify-between"
                  data-testid={`admin-row-${row.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-display font-black text-lg text-tv-green-deep">
                        {row.first_name
                          ? `${row.first_name} ${row.last_name || ""}`
                          : row.name || row.event_title}
                      </span>
                      {row.is_member || row.status === "approved" ? (
                        <span
                          data-testid={`badge-member-${row.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green text-tv-cream px-2.5 py-1 rounded-full"
                        >
                          <UserCheck size={11} /> Socio tesserato
                        </span>
                      ) : (row.email && (tab === "registrations" || tab === "event-signups")) ? (
                        <span
                          data-testid={`badge-not-member-${row.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-bordeaux/15 text-tv-bordeaux px-2.5 py-1 rounded-full"
                        >
                          {row.status === "pending" ? "In attesa" : "Non socio"}
                        </span>
                      ) : null}
                      {row.document_downloaded && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-tv-sky/40 text-tv-green-deep px-2.5 py-1 rounded-full">
                          📥 PDF Scaricato
                        </span>
                      )}
                      {tab === "registrations" && row.metodo_pagamento && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          row.payment_completed
                            ? "bg-tv-green/20 text-tv-green-deep"
                            : row.metodo_pagamento === "elettronico"
                              ? "bg-red-100 text-red-700"
                              : "bg-tv-orange/30 text-tv-green-deep"
                        }`}>
                          {row.metodo_pagamento === "elettronico" ? "💳" : row.metodo_pagamento === "bonifico" ? "🏦" : "💵"}
                          {row.metodo_pagamento === "elettronico"
                            ? (row.payment_completed ? "Pagato online" : "Verifica su SumUp")
                            : (row.payment_completed ? "Pagamento ricevuto" : "Pagamento da ricevere")}
                        </span>
                      )}
                      {row.event_title && (
                        <span className="text-xs font-bold uppercase tracking-wider bg-tv-orange/30 text-tv-green-deep px-2.5 py-1 rounded-full">
                          {row.event_title}
                        </span>
                      )}
                      <span className="text-xs text-tv-green-deep/50">{fmtDate(row.created_at)}</span>
                    </div>
                    <div className="mt-2 text-sm text-tv-green-deep/80 flex flex-wrap gap-x-4 gap-y-1">
                      {row.email && (
                        <a href={`mailto:${row.email}`} className="inline-flex items-center gap-1 hover:text-tv-bordeaux">
                          <Mail size={13} /> {row.email}
                        </a>
                      )}
                      {row.phone && <span>📞 {row.phone}</span>}
                      {row.city && <span>📍 {row.city}</span>}
                      {row.referral && <span>✨ Origine: {row.referral}</span>}
                      {row.is_minorenne && <span className="text-tv-bordeaux font-bold">👶 Minorenne</span>}
                    </div>
                    {(row.motivation || row.message) && (
                      <p className="mt-3 text-sm text-tv-green-deep/70 italic">
                        "{row.motivation || row.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {tab === "registrations" && (
                      <button
                        onClick={() => openTesseraModal(row.id)}
                        disabled={pdfLoadingId === row.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-sky text-tv-green-deep font-bold text-xs hover:bg-tv-sky/80 transition-colors disabled:opacity-50"
                        title="Scarica il PDF del modulo d'iscrizione"
                      >
                        {pdfLoadingId === row.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Download size={13} />
                        )}
                        Scarica PDF
                      </button>
                    )}
                    {tab === "registrations" && row.metodo_pagamento && !row.payment_completed && (
                      <button
                        onClick={() => togglePayment(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs transition-colors bg-tv-orange/30 text-tv-green-deep hover:bg-tv-green/20"
                        title={row.metodo_pagamento === "elettronico" ? "Segna come verificato su SumUp" : "Segna come pagato"}
                      >
                        {row.metodo_pagamento === "elettronico" ? "⏳ Verifica SumUp" : "⏳ Da ricevere"}
                      </button>
                    )}
                    {tab === "registrations" && row.metodo_pagamento && row.payment_completed && (
                      <button
                        onClick={() => togglePayment(row)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs transition-colors bg-tv-green/20 text-tv-green-deep hover:bg-tv-bordeaux/10 hover:text-tv-bordeaux"
                        title="Segna come non ancora pagato"
                      >
                        ✓ Pagato
                      </button>
                    )}
                    {tab === "registrations" && row.status !== "approved" && (
                      <button
                        onClick={() => promoteToMember(row)}
                        data-testid={`admin-promote-${row.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-green text-tv-cream font-bold text-xs hover:bg-tv-green-deep transition-colors"
                        title="Approva la richiesta e registra come socio"
                      >
                        <Sparkles size={13} /> Approva socio
                      </button>
                    )}
                    {tab === "event-signups" && (row.is_member || row.contributo === 0) && !row.confirmed && (
                      <button
                        onClick={() => confirmSignup(row)}
                        data-testid={`admin-confirm-${row.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-orange text-tv-green-deep font-bold text-xs hover:bg-tv-orange/80 transition-colors"
                        title="Conferma presenza e scala posto"
                      >
                        <UserCheck size={13} /> Conferma
                      </button>
                    )}
                    {row.confirmed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green/20 text-tv-green-deep px-2.5 py-1 rounded-full">
                        ✓ Confermato
                      </span>
                    )}
                    {tab === "contacts" && row.email && (
                      <a
                        href={`mailto:${row.email}?subject=${encodeURIComponent("Re: Il tuo messaggio a Trama Viva APS")}&body=${encodeURIComponent(`Ciao ${row.name || ""},\n\nAbbiamo letto il tuo messaggio:\n"${row.message || ""}"\n\n`)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-green-deep/10 text-tv-green-deep font-bold text-xs hover:bg-tv-green-deep hover:text-tv-cream transition-colors"
                        title="Rispondi via email"
                      >
                        <Mail size={13} /> Rispondi
                      </a>
                    )}
                    <button
                      onClick={() => remove(tab, row.id)}
                      data-testid={`admin-delete-${row.id}`}
                      className="p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
                      aria-label="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {eventEditor && (
        <EventEditor
          token={token}
          initial={eventEditor === "new" ? null : eventEditor}
          onClose={() => setEventEditor(null)}
          onSaved={() => { setEventEditor(null); loadAll(); }}
        />
      )}
      {tesseraModal && (() => {
        const membNums = (data.members || []).map(m => parseInt(m.tessera_number)).filter(n => !isNaN(n));
        const regNums = (data.registrations || [])
          .filter(r => r.tessera_number && r.id !== tesseraModal.id)
          .map(r => parseInt(r.tessera_number)).filter(n => !isNaN(n));
        const usedSet = new Set([...membNums, ...regNums]);
        const max = membNums.length > 0 ? Math.max(...membNums) : 0;
        const lacune = Array.from({ length: max }, (_, i) => i + 1).filter(n => !usedSet.has(n));
        const prossima = (max > 0 ? Math.max(...[...membNums, ...regNums].filter(n => !isNaN(n)), 0) : 0) + 1;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-tv-cream rounded-[2rem] p-7 max-w-md w-full shadow-2xl">
              <div className="font-display font-black text-2xl text-tv-green-deep mb-1">🎫 Numero tessera</div>
              <p className="text-sm text-tv-green-deep/70 mb-4">
                Assegna un numero tessera a <strong>{tesseraModal.first_name} {tesseraModal.last_name}</strong> prima di scaricare il PDF (facoltativo).
              </p>
              {lacune.length > 0 && (
                <div className="mb-3 p-3 rounded-2xl bg-tv-orange/15 border border-tv-orange/30">
                  <div className="text-xs font-bold text-tv-green-deep/70 mb-1.5">Buchi disponibili — clicca per selezionare:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {lacune.slice(0, 15).map(n => (
                      <button key={n} type="button" onClick={() => setTesseraInput(String(n))}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border-2 transition-all ${
                          tesseraInput === String(n)
                            ? "border-tv-green bg-tv-green text-tv-cream"
                            : "border-tv-orange/40 bg-tv-orange/20 text-tv-green-deep hover:bg-tv-orange/40"
                        }`}
                      >#{n}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-tv-green-deep/60">Prossima nuova:</span>
                <button type="button" onClick={() => setTesseraInput(String(prossima))}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border-2 transition-all ${
                    tesseraInput === String(prossima)
                      ? "border-tv-green bg-tv-green text-tv-cream"
                      : "border-tv-sky/60 bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky/60"
                  }`}
                >#{prossima}</button>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Inserisci numero tessera"
                value={tesseraInput}
                onChange={e => setTesseraInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-lg font-bold mb-5"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setTesseraModal(null)}
                  className="flex-1 px-4 py-3 rounded-full border-2 border-tv-green-deep/20 text-tv-green-deep font-bold text-sm hover:bg-tv-green-deep/5 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmTesseraAndDownload}
                  disabled={tesseraLoading}
                  className="flex-1 px-4 py-3 rounded-full bg-tv-sky text-tv-green-deep font-bold text-sm hover:bg-tv-sky/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {tesseraLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Scarica PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {memberEditor && (
        <MemberEditor
          token={token}
          initial={memberEditor === "new" ? null : memberEditor}
          onClose={() => setMemberEditor(null)}
          onSaved={() => { setMemberEditor(null); loadAll(); }}
        />
      )}
    </div>
  );
};

const isPast = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

// ─── Notifica partecipante ────────────────────────────────────────────────────

const NOTIFY_PRESETS = {
  reminder: {
    label: "📅 Reminder evento",
    subject: (t) => `📅 Reminder: ${t} — ci vediamo presto!`,
    body: (n, t, ev) => {
      const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); } catch { return d; } };
      const lines = [`Ciao ${n},\n\nti scriviamo per ricordarti che **${t}** si avvicina — non vediamo l'ora di vederti!`];
      if (ev?.date) lines.push(`**📅 ${fmtDate(ev.date)}${ev.time ? ` alle ${ev.time}` : ""}**`);
      if (ev?.location) lines.push(`**📍 ${ev.location}**`);
      lines.push(`Se per qualsiasi motivo non riesci a venire, ti chiediamo gentilmente di avvisarci scrivendo a tramavivaaps@gmail.com.\n\nA presto,\nIl team di Trama Viva APS`);
      return lines.join("\n\n");
    },
  },
  cambio_location: {
    label: "📍 Cambio location",
    subject: (t) => `📍 Aggiornamento location: ${t}`,
    body: (n, t) => `Ciao ${n},\n\nAbbiamo un aggiornamento importante su **${t}**: l'evento si terrà in una nuova location!\n\n**📍 Nuova location: SCRIVI LA NUOVA LOCATION**\n\n[📍 Apri su Google Maps](https://maps.google.com/?q=scrivi+indirizzo)\n\nTutte le altre informazioni rimangono invariate. Non vediamo l'ora di vederti!\n\nA presto,\nIl team di Trama Viva APS`,
  },
  cambio_data: {
    label: "📅 Cambio data",
    subject: (t) => `📅 Cambio data: ${t}`,
    body: (n, t) => `Ciao ${n},\n\nTi scriviamo per informarti che la data di **${t}** è cambiata.\n\n**📅 Nuova data: SCRIVI LA NUOVA DATA**\n\nSperiamo di rivederti presto! Per qualsiasi domanda scrivici a tramavivaaps@gmail.com.\n\nA presto,\nIl team di Trama Viva APS`,
  },
  cambio_orario: {
    label: "🕐 Cambio orario",
    subject: (t) => `🕐 Cambio orario: ${t}`,
    body: (n, t) => `Ciao ${n},\n\nTi scriviamo per informarti che l'orario di **${t}** è cambiato.\n\n**🕐 Nuovo orario: SCRIVI IL NUOVO ORARIO**\n\nTutte le altre informazioni rimangono invariate. A presto!\n\nIl team di Trama Viva APS`,
  },
  annullamento: {
    label: "❌ Annullamento",
    subject: (t) => `Evento annullato: ${t}`,
    body: (n, t) => `Ciao ${n},\n\nPurtroppo dobbiamo comunicarti che **${t}** è stato annullato.\n\nCi dispiace molto — stiamo già lavorando per organizzare nuovi appuntamenti. Tienici d'occhio!\n\nA presto,\nIl team di Trama Viva APS`,
  },
  avviso_generico: {
    label: "📢 Avviso generico",
    subject: (t) => `Aggiornamento: ${t}`,
    body: (n, t) => `Ciao ${n},\n\nHai un messaggio da Trama Viva APS riguardo a **${t}**.\n\nSCRIVI QUI IL TUO MESSAGGIO\n\nA presto,\nIl team di Trama Viva APS`,
  },
};

const NotifyModal = ({ signup, event, token, onClose }) => {
  const name = signup.name || [signup.first_name, signup.last_name].filter(Boolean).join(" ") || "partecipante";
  const [type, setType] = useState("reminder");
  const [subject, setSubject] = useState(() => NOTIFY_PRESETS.reminder.subject(event.title));
  const [body, setBody] = useState(() => NOTIFY_PRESETS.reminder.body(name, event.title, event));
  const [sending, setSending] = useState(false);

  const handleTypeChange = (t) => {
    setType(t);
    setSubject(NOTIFY_PRESETS[t].subject(event.title));
    setBody(NOTIFY_PRESETS[t].body(name, event.title, event));
  };

  const handleSend = async () => {
    if (!signup.email) { toast.error("Questo partecipante non ha un'email registrata."); return; }
    setSending(true);
    try {
      await axios.post(`${API}/admin/events/${event.id}/notify-participant`, {
        email: signup.email, name, subject, body_text: body, notification_type: type,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Notifica inviata a ${signup.email}`);
      onClose();
    } catch { toast.error("Errore nell'invio della notifica."); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-tv-green-deep px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <p className="text-tv-cream/60 text-[10px] font-bold uppercase tracking-wider">Notifica partecipante</p>
            <h2 className="text-tv-cream font-black text-base leading-tight truncate">{event.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-cream/10 text-tv-cream/60 hover:text-tv-cream ml-3 shrink-0"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">Destinatario</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tv-cream/60 border border-tv-green-deep/10">
              <Mail size={13} className="text-tv-green-deep/40 shrink-0"/>
              <span className="text-sm font-semibold text-tv-green-deep truncate">{name}</span>
              {signup.email && <><span className="text-tv-green-deep/30 shrink-0">·</span><span className="text-xs text-tv-green-deep/55 truncate">{signup.email}</span></>}
              {!signup.email && <span className="text-xs text-tv-bordeaux font-bold">nessuna email</span>}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">Tipo avviso</label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {Object.entries(NOTIFY_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => handleTypeChange(key)}
                  className={`text-left px-3 py-2 rounded-xl border text-xs font-bold transition-all ${type === key ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "bg-white border-tv-green-deep/15 text-tv-green-deep/60 hover:border-tv-green-deep/30 hover:bg-tv-cream/50"}`}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">Oggetto</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full text-sm border border-tv-green-deep/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tv-green-deep/20"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">
              Testo email <span className="normal-case font-normal text-tv-green-deep/30">— modificabile</span>
            </label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={9}
              className="w-full text-sm border border-tv-green-deep/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tv-green-deep/20 resize-none leading-relaxed font-mono"/>
            <p className="mt-1.5 text-[10px] text-tv-green-deep/35">
              <code className="bg-tv-cream/80 px-1 rounded">**testo**</code> → <strong>grassetto colorato</strong>{"  ·  "}
              <code className="bg-tv-cream/80 px-1 rounded">[Label](https://url)</code> → bottone link
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-tv-green-deep/20 text-sm text-tv-green-deep/50 hover:bg-tv-cream/60">Annulla</button>
            <button onClick={handleSend} disabled={sending || !signup.email}
              className="px-5 py-2 rounded-xl bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green disabled:opacity-50 flex items-center gap-2">
              {sending ? <Loader2 size={14} className="animate-spin"/> : <Mail size={14}/>}
              {sending ? "Invio…" : "Invia notifica"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkNotifyModal = ({ signupIds, allItems, event, token, onClose }) => {
  const selectedSignups = allItems.filter(s => signupIds.has(s.id));
  const emailTargets = [];
  selectedSignups.forEach(s => {
    if (s.email) emailTargets.push({ name: s.name, email: s.email });
    (s.ospiti || []).forEach(o => {
      if (o.email) emailTargets.push({ name: `${o.nome || ""} ${o.cognome || ""}`.trim(), email: o.email });
    });
  });

  const [type, setType] = useState("reminder");
  const [subject, setSubject] = useState(() => NOTIFY_PRESETS.reminder.subject(event.title));
  const [body, setBody] = useState(() => NOTIFY_PRESETS.reminder.body("a tutte/i", event.title, event));
  const [sending, setSending] = useState(false);
  const [showEmails, setShowEmails] = useState(false);

  const handleTypeChange = (t) => {
    setType(t);
    setSubject(NOTIFY_PRESETS[t].subject(event.title));
    setBody(NOTIFY_PRESETS[t].body("a tutte/i", event.title, event));
  };

  const handleSend = async () => {
    if (emailTargets.length === 0) { toast.error("Nessun destinatario ha un'email registrata."); return; }
    if (!window.confirm(`Inviare la notifica a ${emailTargets.length} destinatari?`)) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/admin/events/${event.id}/notify-all`, {
        signup_ids: [...signupIds], subject, body_text: body, notification_type: type,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Notifica inviata a ${res.data.sent} destinatari!`);
      onClose();
    } catch { toast.error("Errore nell'invio."); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-tv-green-deep px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <p className="text-tv-cream/60 text-[10px] font-bold uppercase tracking-wider">Notifica di gruppo</p>
            <h2 className="text-tv-cream font-black text-base leading-tight truncate">{event.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-tv-cream/10 text-tv-cream/60 hover:text-tv-cream ml-3 shrink-0"><X size={16}/></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <button onClick={() => setShowEmails(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-tv-cream/60 border border-tv-green-deep/10 text-left">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-tv-green-deep/40 shrink-0"/>
                <span className="text-sm font-semibold text-tv-green-deep">{emailTargets.length} destinatari</span>
                <span className="text-xs text-tv-green-deep/40">({signupIds.size} selezionati + eventuali ospiti)</span>
              </div>
              <span className="text-[10px] text-tv-green-deep/40 font-bold">{showEmails ? "▲" : "▼"}</span>
            </button>
            {showEmails && (
              <div className="mt-1 max-h-32 overflow-y-auto border border-tv-green-deep/10 rounded-xl divide-y divide-tv-green-deep/5">
                {emailTargets.length === 0
                  ? <p className="text-xs text-tv-green-deep/40 p-3">Nessuna email disponibile.</p>
                  : emailTargets.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-xs font-medium text-tv-green-deep truncate">{t.name}</span>
                      <span className="text-[10px] text-tv-green-deep/40 truncate">{t.email}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">Tipo avviso</label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {Object.entries(NOTIFY_PRESETS).map(([key, preset]) => (
                <button key={key} onClick={() => handleTypeChange(key)}
                  className={`text-left px-3 py-2 rounded-xl border text-xs font-bold transition-all ${type === key ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "bg-white border-tv-green-deep/15 text-tv-green-deep/60 hover:border-tv-green-deep/30 hover:bg-tv-cream/50"}`}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">Oggetto</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full text-sm border border-tv-green-deep/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tv-green-deep/20"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 mb-1.5">
              Testo email <span className="normal-case font-normal text-tv-green-deep/30">— uguale per tutti i destinatari</span>
            </label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={9}
              className="w-full text-sm border border-tv-green-deep/20 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tv-green-deep/20 resize-none leading-relaxed font-mono"/>
            <p className="mt-1.5 text-[10px] text-tv-green-deep/35">
              <code className="bg-tv-cream/80 px-1 rounded">**testo**</code> → <strong>grassetto colorato</strong>{"  ·  "}
              <code className="bg-tv-cream/80 px-1 rounded">[Label](https://url)</code> → bottone link
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-tv-green-deep/20 text-sm text-tv-green-deep/50 hover:bg-tv-cream/60">Annulla</button>
            <button onClick={handleSend} disabled={sending || emailTargets.length === 0}
              className="px-5 py-2 rounded-xl bg-tv-green-deep text-tv-cream font-bold text-sm hover:bg-tv-green disabled:opacity-50 flex items-center gap-2">
              {sending ? <Loader2 size={14} className="animate-spin"/> : <Mail size={14}/>}
              {sending ? "Invio in corso…" : `Invia a ${emailTargets.length} destinatari`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Event signups — master-detail con tabella compatta ──────────────────────

const SignupRow = ({ row, founderEmails, isSelected, onToggleSelect, onConfirm, onTogglePayment, onDelete, onNotify, isPastEvent }) => {
  const [showGuests, setShowGuests] = useState(false);
  const hasGuests = (row.ospiti || []).length > 0;
  const isFounder = row.is_member && founderEmails.has((row.email || "").toLowerCase());

  return (
    <>
      <tr className={`group border-b border-tv-green-deep/5 transition-colors ${
        isSelected ? "bg-tv-green/5"
        : !row.confirmed ? "bg-amber-50/50 hover:bg-amber-50/80"
        : "hover:bg-tv-cream/60"
      }`}>
        <td className="py-3 pl-4 pr-2 w-8">
          <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(row.id)}
            className="w-4 h-4 accent-tv-green cursor-pointer" />
        </td>
        <td className="py-3 pr-4 min-w-[160px]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tv-green-deep text-tv-cream flex items-center justify-center font-black text-sm flex-shrink-0">
              {(row.name?.[0] || "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-tv-green-deep">{row.name}</span>
                {isFounder && <span className="text-[9px] font-bold uppercase bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full">Fondatore</span>}
                {row.is_member && !isFounder && <span className="text-[9px] font-bold uppercase bg-tv-green text-tv-cream px-1.5 py-0.5 rounded-full">Socio</span>}
              </div>
              {row.message && <p className="text-[11px] text-tv-green-deep/40 italic truncate max-w-[180px]">"{row.message}"</p>}
            </div>
          </div>
        </td>
        <td className="py-3 pr-4">
          <div className="text-xs text-tv-green-deep/60 space-y-0.5">
            {row.email && <a href={`mailto:${row.email}`} className="flex items-center gap-1 hover:text-tv-bordeaux truncate max-w-[180px]"><Mail size={10}/>{row.email}</a>}
            {row.phone && <div className="text-tv-green-deep/40">📞 {row.phone}</div>}
          </div>
        </td>
        <td className="py-3 pr-4 text-center">
          {row.num_persone > 1 ? (
            <button onClick={() => setShowGuests(v => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold bg-tv-sky/30 text-tv-green-deep px-2 py-1 rounded-full hover:bg-tv-sky/50 transition-colors">
              👥 {row.num_persone} {hasGuests && (showGuests ? <ChevronUp size={10}/> : <ChevronDown size={10}/>)}
            </button>
          ) : <span className="text-sm text-tv-green-deep/40">1</span>}
        </td>
        <td className="py-3 pr-4">
          <span className="text-xs text-tv-green-deep/70">{row.opzione_scelta || <span className="text-tv-green-deep/25">—</span>}</span>
        </td>
        <td className="py-3 pr-4">
          <div className="space-y-1">
            {row.donazione_volontaria > 0 && (
              <span className="block text-[10px] font-bold bg-tv-green/15 text-tv-green-deep px-2 py-0.5 rounded-full">💚 {row.donazione_volontaria}€</span>
            )}
            {row.metodo_pagamento ? (
              row.payment_completed
                ? <span className="block text-[10px] font-bold bg-tv-green/15 text-tv-green-deep px-2 py-0.5 rounded-full">✓ {row.metodo_pagamento}</span>
                : <span className="block text-[10px] font-bold bg-tv-orange/20 text-tv-bordeaux px-2 py-0.5 rounded-full">⏳ {row.metodo_pagamento}</span>
            ) : <span className="text-tv-green-deep/25 text-xs">—</span>}
          </div>
        </td>
        <td className="py-3 pr-2">
          {row.confirmed
            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-tv-green/20 text-tv-green-deep px-2 py-1 rounded-full whitespace-nowrap">✓ Confermato</span>
            : <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-tv-orange/15 text-tv-bordeaux px-2 py-1 rounded-full whitespace-nowrap">⏳ In attesa</span>}
        </td>
        <td className="py-3 pr-4 text-right">
          <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
            {!row.confirmed && !isPastEvent && (
              <button onClick={() => onConfirm(row)} title="Conferma"
                className="p-1.5 rounded-lg bg-tv-orange/20 text-tv-orange hover:bg-tv-orange hover:text-tv-cream transition-colors">
                <UserCheck size={13}/>
              </button>
            )}
            {row.metodo_pagamento && !row.payment_completed && (
              <button onClick={() => onTogglePayment(row)} title="Segna pagato"
                className="p-1.5 rounded-lg bg-tv-green/20 text-tv-green-deep hover:bg-tv-green hover:text-tv-cream transition-colors text-xs">
                💸
              </button>
            )}
            {row.metodo_pagamento && row.payment_completed && (
              <button onClick={() => onTogglePayment(row)} title="Annulla pagamento"
                className="p-1.5 rounded-lg bg-tv-green-deep/10 text-tv-green-deep/50 hover:bg-tv-bordeaux/20 hover:text-tv-bordeaux transition-colors text-xs">
                ↩
              </button>
            )}
            {row.email && (
              <button onClick={() => onNotify(row)} title="Invia notifica email"
                className="p-1.5 rounded-lg bg-tv-sky/20 text-tv-sky hover:bg-tv-sky hover:text-tv-cream transition-colors">
                <Mail size={13}/>
              </button>
            )}
            <button onClick={() => onDelete(row.id)} title="Elimina"
              className="p-1.5 rounded-lg bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors">
              <Trash2 size={13}/>
            </button>
          </div>
        </td>
      </tr>
      {showGuests && hasGuests && row.ospiti.map((g, i) => (
        <tr key={i} className="bg-tv-cream/50 border-b border-tv-green-deep/5">
          <td className="pl-4 pr-2"/>
          <td className="py-2 pr-4" colSpan={1}>
            <div className="flex items-center gap-2 pl-8">
              <div className="w-6 h-6 rounded-md bg-tv-green-deep/15 text-tv-green-deep flex items-center justify-center font-bold text-[10px]">
                {(g.nome?.[0] || "?").toUpperCase()}
              </div>
              <span className="text-xs text-tv-green-deep/70">{g.nome} {g.cognome}</span>
            </div>
          </td>
          <td className="py-2 pr-4 hidden md:table-cell">
            <span className="text-xs text-tv-green-deep/50">{g.email || "—"}</span>
          </td>
          <td colSpan={5} className="py-2 pr-4 text-[11px] text-tv-green-deep/35">ospite</td>
        </tr>
      ))}
    </>
  );
};

const EventSignupsManager = ({ signups, members, events, onConfirm, onDelete, onTogglePayment, token, onReload }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [reminderLoading, setReminderLoading] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState(null);
  const [bulkNotifyOpen, setBulkNotifyOpen] = useState(false);

  const eventById = useMemo(() => {
    const map = {};
    (events || []).forEach(ev => { map[ev.id] = ev; });
    return map;
  }, [events]);

  const groups = useMemo(() => {
    const map = {};
    (signups || []).forEach(s => {
      const evId = s.event_id;
      if (!evId || !eventById[evId]) return;
      if (!map[evId]) map[evId] = { ev: eventById[evId], items: [] };
      map[evId].items.push(s);
    });
    return Object.values(map).sort((a, b) => {
      const pa = isPast(a.ev.date), pb = isPast(b.ev.date);
      if (pa !== pb) return pa ? 1 : -1;
      return new Date(b.ev.date) - new Date(a.ev.date);
    });
  }, [signups, eventById]);

  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    setSelectedEventId(prev => {
      if (prev && groups.find(g => g.ev.id === prev)) return prev;
      return groups[0]?.ev.id ?? null;
    });
  }, [groups]);

  const selectedGroup = groups.find(g => g.ev.id === selectedEventId) ?? null;
  const isPastEvent = selectedGroup ? isPast(selectedGroup.ev.date) : false;

  const founderEmails = useMemo(() =>
    new Set((members || []).filter(m => !m.tessera_number).map(m => (m.email || "").toLowerCase())),
    [members]
  );

  const filteredItems = useMemo(() => {
    if (!selectedGroup) return [];
    // Per eventi conclusi: mostra solo i confermati
    const base = isPastEvent
      ? selectedGroup.items.filter(r => r.confirmed)
      : selectedGroup.items;
    const afterFilter = activeFilter === "pending"
      ? base.filter(r => !r.confirmed)
      : activeFilter === "confirmed"
      ? base.filter(r => r.confirmed)
      : base;
    const q = searchQuery.trim().toLowerCase();
    const result = q
      ? afterFilter.filter(s =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q)
        )
      : afterFilter;
    return [...result].sort((a, b) => {
      if (a.confirmed !== b.confirmed) return a.confirmed ? 1 : -1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [selectedGroup, isPastEvent, activeFilter, searchQuery]);

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const selectAll = () => setSelectedIds(new Set(filteredItems.filter(r => !r.confirmed).map(r => r.id)));

  const exportGroup = (group) => {
    const rows = group.items.flatMap(s => {
      const main = {
        "Nome": s.name, "Email": s.email, "Telefono": s.phone || "",
        "N. Persone": s.num_persone || 1, "Opzione": s.opzione_scelta || "",
        "Donazione (€)": s.donazione_volontaria || "",
        "Pagamento": s.metodo_pagamento || "", "Pagato": s.payment_completed ? "Sì" : "No",
        "Confermato": s.confirmed ? "Sì" : "No", "Note": s.message || "",
      };
      const guests = (s.ospiti || []).map(g => ({
        "Nome": `${g.nome} ${g.cognome}`, "Email": g.email || "", "Telefono": g.phone || "",
        "N. Persone": "(ospite)", "Opzione": "", "Donazione (€)": "", "Pagamento": "",
        "Pagato": "", "Confermato": "", "Note": "",
      }));
      return [main, ...guests];
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Partecipanti");
    const fname = group.ev.title.replace(/[^a-zA-Z0-9àèìòùÀÈÌÒÙ\s]/g, "").trim().replace(/\s+/g, "_");
    XLSX.writeFile(wb, `${fname}_partecipanti.xlsx`);
    toast.success(`Export "${group.ev.title}" scaricato!`);
  };

  const sendReminder = async (eventId, eventTitle) => {
    const confirmed = (signups || []).filter(s => s.event_id === eventId && s.confirmed).length;
    if (confirmed === 0) { toast.error("Nessun iscritto confermato per questo evento."); return; }
    if (!window.confirm(`Inviare email reminder a ${confirmed} iscritti confermati di "${eventTitle}"?`)) return;
    setReminderLoading(eventId);
    try {
      const res = await axios.post(`${API}/admin/events/${eventId}/send-reminder`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Reminder inviato a ${res.data.sent} persone!`);
    } catch {
      toast.error("Errore nell'invio del reminder.");
    } finally {
      setReminderLoading(null);
    }
  };

  const bulkConfirm = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Confermare ${selectedIds.size} iscrizioni selezionate?`)) return;
    setBulkLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/event-signups/bulk-confirm`,
        { signup_ids: [...selectedIds] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${res.data.confirmed} iscrizioni confermate!`);
      setSelectedIds(new Set());
      if (typeof onReload === "function") onReload();
    } catch {
      toast.error("Errore nella conferma multipla.");
    } finally {
      setBulkLoading(false);
    }
  };

  if (!signups || signups.length === 0 || groups.length === 0) {
    return (
      <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
        Ancora nessuna richiesta evento.
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-tv-green-deep/10 bg-white overflow-hidden">

      {/* Mobile: dropdown evento */}
      <div className="block md:hidden px-4 py-3 border-b border-tv-green-deep/10 bg-tv-cream/40">
        <label className="text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 block mb-1.5">
          {groups.length} {groups.length === 1 ? "evento" : "eventi"}
        </label>
        <select
          value={selectedEventId || ""}
          onChange={e => { setSelectedEventId(e.target.value); setSearchQuery(""); setSelectedIds(new Set()); setActiveFilter("all"); }}
          className="w-full px-3 py-2.5 rounded-xl bg-white border border-tv-green-deep/15 text-sm text-tv-green-deep outline-none focus:border-tv-green"
        >
          {groups.map(({ ev, items }) => {
            const confirmedPpl = items.filter(r => r.confirmed).reduce((s, r) => s + (r.num_persone || 1), 0);
            const totalPeople = items.reduce((s, r) => s + (r.num_persone || 1), 0);
            const past = isPast(ev.date);
            return (
              <option key={ev.id} value={ev.id}>
                {past ? "✓ " : ""}{ev.title} — {confirmedPpl}/{totalPeople} conf.
              </option>
            );
          })}
        </select>
      </div>

      {/* ── Colonna destra: dettaglio ── */}
      <div className="md:flex md:h-[calc(100vh-200px)] md:min-h-[600px] md:overflow-hidden">
      {/* Sidebar verticale: lista eventi (solo desktop) */}
      <div className="hidden md:flex flex-shrink-0 w-60 xl:w-64 border-r border-tv-green-deep/10 bg-tv-cream/40 flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-tv-green-deep/10 flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-tv-green-deep/40">
            {groups.length} {groups.length === 1 ? "evento" : "eventi"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {groups.map(({ ev, items }) => {
            const totalPeople = items.reduce((s, r) => s + (r.num_persone || 1), 0);
            const confirmedPpl = items.filter(r => r.confirmed).reduce((s, r) => s + (r.num_persone || 1), 0);
            const past = isPast(ev.date);
            const isSelected = selectedEventId === ev.id;
            const pct = totalPeople > 0 ? Math.round((confirmedPpl / totalPeople) * 100) : 0;
            return (
              <button
                key={ev.id}
                onClick={() => { setSelectedEventId(ev.id); setSearchQuery(""); setSelectedIds(new Set()); setActiveFilter("all"); }}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                  isSelected
                    ? past ? "bg-gray-400/70 shadow-md" : "bg-tv-green-deep shadow-md"
                    : past ? "hover:bg-gray-200/60 opacity-60 hover:opacity-80" : "hover:bg-tv-green-deep/6"
                }`}
              >
                <div className={`font-semibold text-sm leading-snug mb-0.5 line-clamp-2 ${
                  isSelected ? "text-white" : past ? "text-gray-400" : "text-tv-green-deep"
                }`}>{ev.title}</div>
                <div className={`text-[10px] mb-2 truncate ${
                  isSelected ? "text-white/60" : past ? "text-gray-400/70" : "text-tv-green-deep/45"
                }`}>{fmtDay(ev.date)}{past ? " · concluso" : ""}</div>
                <div className={`h-1 rounded-full mb-1.5 ${isSelected ? "bg-white/20" : past ? "bg-gray-300/50" : "bg-tv-green-deep/10"}`}>
                  <div className={`h-1 rounded-full transition-all ${
                    past ? (isSelected ? "bg-white/50" : "bg-gray-400/60") : pct === 100 ? "bg-tv-green" : isSelected ? "bg-tv-orange/80" : "bg-tv-orange"
                  }`} style={{ width: `${pct}%` }}/>
                </div>
                <div className={`text-[10px] font-bold ${isSelected ? "text-white/60" : past ? "text-gray-400/70" : "text-tv-green-deep/45"}`}>
                  {confirmedPpl}/{totalPeople} conf.
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="md:flex-1 md:min-w-0 md:flex md:flex-col md:overflow-hidden">
        {selectedGroup ? (() => {
          const allItems = selectedGroup.items;
          const totalPeople = allItems.reduce((s, r) => s + (r.num_persone || 1), 0);
          const confirmedPpl = allItems.filter(r => r.confirmed).reduce((s, r) => s + (r.num_persone || 1), 0);
          const pendingPpl = totalPeople - confirmedPpl;
          const paidCount = allItems.filter(r => r.payment_completed).length;
          const unpaidCount = allItems.filter(r => r.metodo_pagamento && !r.payment_completed).length;
          const pendingCount = allItems.filter(r => !r.confirmed).length;
          return (
            <>
              {/* Header */}
              <div className="px-4 md:px-6 py-4 border-b border-tv-green-deep/10 flex-shrink-0">
                <div className="flex items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-black text-lg text-tv-green-deep leading-tight">{selectedGroup.ev.title}</h2>
                    <p className="text-xs text-tv-green-deep/45 mt-0.5">
                      {fmtDay(selectedGroup.ev.date)}{selectedGroup.ev.time ? ` · ${selectedGroup.ev.time}` : ""}{selectedGroup.ev.location ? ` · ${selectedGroup.ev.location}` : ""}
                      {isPastEvent && <span className="ml-2 px-1.5 py-0.5 bg-tv-green-deep/10 text-tv-green-deep/50 rounded text-[10px] font-bold uppercase">Concluso</span>}
                    </p>
                  </div>
                  <button onClick={() => exportGroup(selectedGroup)} title="Esporta XLSX"
                    className="p-2 rounded-xl hover:bg-tv-sky/20 text-tv-green-deep/40 hover:text-tv-green-deep transition-colors flex-shrink-0">
                    <Download size={15}/>
                  </button>
                  {!isPastEvent && (
                    <button onClick={() => sendReminder(selectedGroup.ev.id, selectedGroup.ev.title)}
                      disabled={reminderLoading === selectedGroup.ev.id} title="Invia reminder ai confermati"
                      className="p-2 rounded-xl hover:bg-tv-orange/20 text-tv-green-deep/40 hover:text-tv-orange transition-colors flex-shrink-0 disabled:opacity-40">
                      {reminderLoading === selectedGroup.ev.id ? <Loader2 size={15} className="animate-spin"/> : <Mail size={15}/>}
                    </button>
                  )}
                </div>
                {/* Mobile: stats grid 2x2 */}
                <div className="grid grid-cols-2 gap-2 mt-2 md:hidden">
                  {[
                    { label: "Persone", value: totalPeople, cls: "text-tv-green-deep", bg: "bg-tv-sky/20" },
                    { label: "Confermati", value: confirmedPpl, cls: "text-tv-green-deep", bg: "bg-tv-green/15" },
                    ...(!isPastEvent && pendingPpl > 0 ? [{ label: "In attesa", value: pendingPpl, cls: "text-tv-bordeaux", bg: "bg-tv-orange/15" }] : []),
                    ...(paidCount > 0 ? [{ label: "Pagati", value: paidCount, cls: "text-tv-green-deep", bg: "bg-tv-mint/20" }] : []),
                  ].map(({ label, value, cls, bg }) => (
                    <div key={label} className={`${bg} rounded-xl px-3 py-2 text-center`}>
                      <div className={`font-black text-xl ${cls}`}>{value}</div>
                      <div className="text-[10px] text-tv-green-deep/40 uppercase tracking-wider">{label}</div>
                    </div>
                  ))}
                </div>
                {/* Desktop: chips */}
                <div className="hidden md:flex items-center gap-2 flex-wrap mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-tv-sky/30 text-tv-green-deep px-2.5 py-1 rounded-full">
                    👥 {totalPeople} {totalPeople === 1 ? "persona" : "persone"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-tv-green/20 text-tv-green-deep px-2.5 py-1 rounded-full">
                    ✓ {confirmedPpl} confermati
                  </span>
                  {!isPastEvent && pendingPpl > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-tv-orange/20 text-tv-bordeaux px-2.5 py-1 rounded-full">
                      ⏳ {pendingPpl} in attesa
                    </span>
                  )}
                  {paidCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-tv-mint/50 text-tv-green-deep px-2.5 py-1 rounded-full">
                      💸 {paidCount} pagati
                    </span>
                  )}
                  {unpaidCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-tv-orange/10 text-tv-bordeaux px-2.5 py-1 rounded-full">
                      ⚠️ {unpaidCount} da incassare
                    </span>
                  )}
                </div>
              </div>

              {/* Toolbar: filtri + search + bulk */}
              <div className="px-3 md:px-6 py-3 border-b border-tv-green-deep/10 md:flex-shrink-0 flex flex-col md:flex-row md:flex-wrap md:items-center gap-2 md:gap-3">
                {/* Mobile: filter select */}
                <div className="flex gap-2 md:hidden">
                  <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-tv-cream border border-tv-green-deep/15 text-sm text-tv-green-deep outline-none">
                    <option value="all">Tutti ({isPastEvent ? confirmedPpl : totalPeople})</option>
                    {!isPastEvent && <option value="pending">In attesa ({pendingPpl})</option>}
                    <option value="confirmed">Confermati ({confirmedPpl})</option>
                  </select>
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-green-deep/35 pointer-events-none"/>
                    <input type="text" placeholder="Cerca…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-tv-cream border border-tv-green-deep/15 focus:border-tv-green outline-none text-sm text-tv-green-deep"/>
                  </div>
                </div>
                {/* Desktop: filter pills */}
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1 bg-tv-cream rounded-xl p-1 w-max">
                    {[
                      { key: "all", label: `Tutti (${isPastEvent ? confirmedPpl : totalPeople})` },
                      ...(!isPastEvent ? [{ key: "pending", label: `In attesa (${pendingPpl})` }] : []),
                      { key: "confirmed", label: `Confermati (${confirmedPpl})` },
                    ].map(f => (
                      <button key={f.key} onClick={() => setActiveFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          activeFilter === f.key ? "bg-tv-green-deep text-tv-cream shadow-sm" : "text-tv-green-deep/50 hover:text-tv-green-deep"
                        }`}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="relative flex-1 min-w-0 hidden md:block">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-green-deep/35 pointer-events-none"/>
                  <input type="text" placeholder="Cerca nome o email…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-1.5 rounded-xl bg-tv-cream border border-tv-green-deep/15 focus:border-tv-green outline-none text-xs text-tv-green-deep"/>
                </div>
                {selectedIds.size > 0 ? (
                  <div className="flex items-center gap-2 bg-tv-green/10 border border-tv-green/25 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-bold text-tv-green-deep">{selectedIds.size} sel.</span>
                    <button onClick={() => setSelectedIds(new Set())} className="text-[10px] text-tv-green-deep/50 hover:text-tv-bordeaux font-bold">✕</button>
                    <button onClick={bulkConfirm} disabled={bulkLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tv-green text-tv-cream font-bold text-[11px] hover:bg-tv-green-deep disabled:opacity-50">
                      {bulkLoading ? <Loader2 size={11} className="animate-spin"/> : <UserCheck size={11}/>} Conferma
                    </button>
                    <button onClick={() => setBulkNotifyOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tv-sky/80 text-tv-cream font-bold text-[11px] hover:bg-tv-sky">
                      <Mail size={11}/> Notifica
                    </button>
                  </div>
                ) : !isPastEvent && filteredItems.some(r => !r.confirmed) && (
                  <button onClick={selectAll} className="text-xs text-tv-green-deep/50 hover:text-tv-green-deep font-bold whitespace-nowrap">
                    Seleziona tutti in attesa
                  </button>
                )}
              </div>

              {/* Tabella */}
              <div className="flex-1 min-w-0 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="text-center text-tv-green-deep/35 py-16 text-sm">
                    {searchQuery ? "Nessun risultato per la ricerca." : isPastEvent ? "Nessun partecipante confermato per questo evento." : "Nessuna iscrizione."}
                  </div>
                ) : (
                  <>
                    {/* Desktop: tabella */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-tv-cream/95 backdrop-blur-sm z-10">
                          <tr className="text-left border-b border-tv-green-deep/10">
                            <th className="py-2.5 pl-4 pr-2 w-8">
                              <input type="checkbox"
                                checked={filteredItems.filter(r=>!r.confirmed).length > 0 && filteredItems.filter(r=>!r.confirmed).every(r=>selectedIds.has(r.id))}
                                onChange={() => {
                                  const pending = filteredItems.filter(r=>!r.confirmed);
                                  if (pending.every(r=>selectedIds.has(r.id))) setSelectedIds(new Set());
                                  else setSelectedIds(new Set(pending.map(r=>r.id)));
                                }}
                                className="w-4 h-4 accent-tv-green cursor-pointer"
                              />
                            </th>
                            <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Partecipante</th>
                            <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Contatti</th>
                            <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 text-center">Persone</th>
                            <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Opzione</th>
                            <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Pagamento</th>
                            <th className="py-2.5 pr-4 text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40">Stato</th>
                            <th className="py-2.5 pr-4 w-24"/>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map(row => (
                            <SignupRow
                              key={row.id}
                              row={row}
                              founderEmails={founderEmails}
                              isSelected={selectedIds.has(row.id)}
                              onToggleSelect={toggleSelect}
                              onConfirm={onConfirm}
                              onTogglePayment={onTogglePayment}
                              onDelete={onDelete}
                              onNotify={(row) => setNotifyTarget({ signup: row, event: selectedGroup.ev })}
                              isPastEvent={isPastEvent}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: card list */}
                    <div className="block md:hidden space-y-2 p-3 overflow-x-hidden">
                      {filteredItems.map(row => {
                        const isFounder = row.is_member && founderEmails.has((row.email || "").toLowerCase());
                        return (
                          <div key={row.id} className={`rounded-2xl border p-4 ${
                            selectedIds.has(row.id) ? "border-tv-green/50 bg-tv-green/5"
                            : row.confirmed ? "bg-white border-tv-green-deep/10"
                            : "bg-amber-50/60 border-tv-orange/20"
                          }`}>
                            {/* Top: nome + stato */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {!isPastEvent && (
                                  <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)}
                                    className="w-4 h-4 accent-tv-green cursor-pointer shrink-0"/>
                                )}
                                <div className="w-9 h-9 rounded-xl bg-tv-green-deep text-tv-cream flex items-center justify-center font-black text-sm shrink-0">
                                  {(row.name?.[0] || "?").toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-sm text-tv-green-deep">{row.name}</span>
                                    {isFounder && <span className="text-[9px] font-bold uppercase bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full">Fondatore</span>}
                                    {row.is_member && !isFounder && <span className="text-[9px] font-bold uppercase bg-tv-green text-tv-cream px-1.5 py-0.5 rounded-full">Socio</span>}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-tv-green-deep/50 mt-0.5">
                                    <span>👥 {row.num_persone || 1}</span>
                                    {row.opzione_scelta && <span className="truncate">{row.opzione_scelta}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                {row.confirmed
                                  ? <span className="text-[10px] font-bold bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full whitespace-nowrap">✓ Conf.</span>
                                  : <span className="text-[10px] font-bold bg-tv-orange/15 text-tv-bordeaux px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Attesa</span>}
                              </div>
                            </div>
                            {/* Info secondarie */}
                            <div className="text-xs text-tv-green-deep/55 space-y-1 mb-3">
                              {row.email && <a href={`mailto:${row.email}`} className="flex items-center gap-1.5 hover:text-tv-bordeaux min-w-0"><Mail size={11} className="shrink-0"/><span className="truncate">{row.email}</span></a>}
                              {row.phone && <div>📞 {row.phone}</div>}
                              {row.message && <p className="italic text-tv-green-deep/40">"{row.message}"</p>}
                              {(row.ospiti || []).length > 0 && (
                                <div className="space-y-0.5">
                                  {row.ospiti.map((g, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                      <div className="w-4 h-4 rounded bg-tv-green-deep/10 text-tv-green-deep flex items-center justify-center text-[9px] font-bold shrink-0">
                                        {(g.nome?.[0] || "?").toUpperCase()}
                                      </div>
                                      <span>{g.nome} {g.cognome}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {(row.metodo_pagamento || row.donazione_volontaria > 0) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {row.donazione_volontaria > 0 && <span className="text-[10px] font-bold bg-tv-green/15 text-tv-green-deep px-2 py-0.5 rounded-full">💚 {row.donazione_volontaria}€</span>}
                                  {row.metodo_pagamento && (row.payment_completed
                                    ? <span className="text-[10px] font-bold bg-tv-green/15 text-tv-green-deep px-2 py-0.5 rounded-full">✓ {row.metodo_pagamento}</span>
                                    : <span className="text-[10px] font-bold bg-tv-orange/20 text-tv-bordeaux px-2 py-0.5 rounded-full">⏳ {row.metodo_pagamento}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* Azioni */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-tv-green-deep/8">
                              {!row.confirmed && !isPastEvent && (
                                <button onClick={() => onConfirm(row)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-orange/20 text-tv-orange text-[11px] font-bold rounded-full hover:bg-tv-orange hover:text-tv-cream transition-colors">
                                  <UserCheck size={11}/> Conferma
                                </button>
                              )}
                              {row.metodo_pagamento && !row.payment_completed && (
                                <button onClick={() => onTogglePayment(row)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-green/20 text-tv-green-deep text-[11px] font-bold rounded-full hover:bg-tv-green hover:text-tv-cream transition-colors">
                                  💸 Pagamento
                                </button>
                              )}
                              {row.metodo_pagamento && row.payment_completed && (
                                <button onClick={() => onTogglePayment(row)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-green-deep/10 text-tv-green-deep/50 text-[11px] font-bold rounded-full hover:bg-tv-bordeaux/20 hover:text-tv-bordeaux transition-colors">
                                  ↩ Annulla
                                </button>
                              )}
                              {row.email && (
                                <button onClick={() => setNotifyTarget({ signup: row, event: selectedGroup.ev })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-tv-sky/20 text-tv-green-deep text-[11px] font-bold rounded-full hover:bg-tv-sky hover:text-tv-cream transition-colors">
                                  <Mail size={11}/> Email
                                </button>
                              )}
                              <button onClick={() => onDelete(row.id)}
                                className="p-1.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors">
                                <Trash2 size={12}/>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          );
        })() : (
          <div className="flex-1 flex items-center justify-center text-tv-green-deep/30 text-sm">
            Seleziona un evento dalla lista
          </div>
        )}
      </div>
      </div>
      {notifyTarget && (
        <NotifyModal
          signup={notifyTarget.signup}
          event={notifyTarget.event}
          token={token}
          onClose={() => setNotifyTarget(null)}
        />
      )}
      {bulkNotifyOpen && selectedGroup && (
        <BulkNotifyModal
          signupIds={selectedIds}
          allItems={selectedGroup.items}
          event={selectedGroup.ev}
          token={token}
          onClose={() => setBulkNotifyOpen(false)}
        />
      )}
    </div>
  );
};

// ─── Events manager con storico ───────────────────────────────────────────────

const EventsManager = ({ events, onCreate, onEdit, onDelete }) => {
  const fmtDay = (d) => {
    try { return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const upcoming = events.filter((ev) => !isPast(ev.date));
  const past = events.filter((ev) => isPast(ev.date));

  const renderEventRow = (ev) => (
    <article
      key={ev.id}
      data-testid={`admin-event-row-${ev.id}`}
      className="bg-white rounded-3xl p-5 md:p-6 border border-tv-green-deep/10 flex flex-col md:flex-row md:items-center gap-4 justify-between"
    >
      <div className="flex items-start gap-4 flex-1">
        {ev.has_image ? (
          <img src={`${API}/events/${ev.id}/image`} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <span className="text-3xl">{ev.emoji}</span>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider bg-tv-sky/40 text-tv-green-deep px-2.5 py-1 rounded-full">
              {ev.category}
            </span>
            <span className="text-xs text-tv-green-deep/60">
              {fmtDay(ev.date)} · {ev.time}
            </span>
          </div>
          <h3 className="mt-1 font-display font-black text-lg text-tv-green-deep flex items-center gap-2">
            {ev.title}
            {ev.featured && (
              <span className="text-xs font-bold uppercase tracking-wider bg-tv-orange text-tv-green-deep px-2 py-0.5 rounded-full">
                ⭐ In Evidenza
              </span>
            )}
          </h3>
          <div className="text-sm text-tv-green-deep/70">📍 {ev.location} · 👥 {ev.spots} posti · 💶 {ev.contributo > 0 ? `${ev.contributo}€` : "Gratuito"}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-center">
        <button
          onClick={() => onEdit(ev)}
          data-testid={`admin-event-edit-${ev.id}`}
          className="p-2.5 rounded-full bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky transition-colors"
          aria-label="Modifica"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(ev.id)}
          data-testid={`admin-event-delete-${ev.id}`}
          className="p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
          aria-label="Elimina"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );

  return (
    <div data-testid="admin-events-manager">
      <button
        onClick={onCreate}
        data-testid="admin-event-new"
        className="btn-tv inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold mb-6"
      >
        <Plus size={18} /> Crea nuovo evento
      </button>
      {events.length === 0 ? (
        <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
          Nessun evento ancora. Crea il primo!
        </div>
      ) : (
        <>
          {upcoming.length === 0 && past.length > 0 && (
            <div className="rounded-2xl p-5 bg-tv-sky/20 border border-tv-green-deep/10 text-tv-green-deep/60 text-sm mb-6">
              Nessun evento in programma. Crea un nuovo evento o controlla lo storico qui sotto.
            </div>
          )}
          {upcoming.length > 0 && <div className="grid gap-3">{upcoming.map(renderEventRow)}</div>}
          {past.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-8">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-tv-green-deep/40">📁 Storico eventi</span>
                <div className="flex-1 border-t border-tv-green-deep/10" />
              </div>
              <div className="grid gap-3 opacity-60">{past.map(renderEventRow)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const EventEditor = ({ token, initial, onClose, onSaved }) => {
  const isNew = !initial;
  const [form, setForm] = useState(
    initial || {
      title: "", category: CATEGORIES[0], date: "", time: "19:00",
      location: "", description: "", emoji: "✨", spots: 20, featured: false, contributo: 0,
      contributo_note: "", non_rimborsabile: false, solo_soci: false,
      contributo_volontario: false, opzioni_label: "", opzioni_custom: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const currentImageSrc = imageData || (!imageRemoved && initial?.has_image ? `${API}/events/${initial?.id}/image` : null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImageData(ev.target.result); setImageRemoved(false); };
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.date || !form.time || !form.location || !form.description) {
      toast.error("Compila tutti i campi obbligatori.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, spots: Number(form.spots) >= 0 ? Number(form.spots) : 20 };
      const headers = { Authorization: `Bearer ${token}` };
      let eventId;
      if (isNew) {
        const res = await axios.post(`${API}/admin/events`, payload, { headers });
        eventId = res.data.id;
        toast.success("Evento creato!");
      } else {
        await axios.put(`${API}/admin/events/${initial.id}`, payload, { headers });
        eventId = initial.id;
        toast.success("Evento aggiornato!");
      }
      if (imageData) {
        await axios.post(`${API}/admin/events/${eventId}/image`, { image_data: imageData }, { headers });
      } else if (imageRemoved && !isNew) {
        await axios.delete(`${API}/admin/events/${eventId}/image`, { headers });
      }
      onSaved();
    } catch (err) {
      toast.error("Errore nel salvataggio.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-tv-green-deep/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-2xl bg-tv-cream rounded-[2rem] p-5 md:p-9 my-4 md:my-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">{isNew ? "Nuovo evento" : "Modifica evento"}</div>
            <h3 className="mt-1 font-display font-black text-xl md:text-3xl text-tv-green-deep">{isNew ? "Crea evento" : form.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-tv-green-deep text-tv-cream hover:bg-tv-green"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Titolo *" value={form.title} onChange={change("title")} required />
          <label className="block">
            <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Categoria *</div>
            <select value={form.category} onChange={change("category")} className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <Field label="Data *" type="date" value={form.date} onChange={change("date")} required />
          <Field label="Ora *" type="time" value={form.time} onChange={change("time")} required />
          <Field label="Luogo *" value={form.location} onChange={change("location")} required />
          <Field label="Posti" type="number" value={form.spots} onChange={change("spots")} />
          <label className="block">
            <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Contributo (€)</div>
            <input type="number" min="0" step="0.01" value={form.contributo ?? 0} onChange={(e) => setForm({ ...form, contributo: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep outline-none" />
          </label>
          <label className="block sm:col-span-2">
            <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Nota contributo</div>
            <input type="text" value={form.contributo_note ?? ""} onChange={change("contributo_note")} placeholder="Es. per prenotazione tavolo pic-nic" className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep outline-none" />
          </label>
        </div>
        <label className="block mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Descrizione *</div>
          <textarea rows={4} value={form.description} onChange={change("description")} className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep resize-none outline-none" />
        </label>
        <button
          type="button"
          onClick={() => setForm({ ...form, featured: !form.featured })}
          className={`mt-4 w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all ${
            form.featured
              ? "border-tv-orange bg-tv-orange/10 text-tv-green-deep"
              : "border-tv-green-deep/15 bg-white text-tv-green-deep/50 hover:border-tv-green-deep/30"
          }`}
        >
          <span className="font-bold text-sm">⭐ Evento in evidenza</span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            form.featured ? "bg-tv-orange text-tv-green-deep" : "bg-tv-green-deep/10 text-tv-green-deep/50"
          }`}>
            {form.featured ? "Attivo" : "Non attivo"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, non_rimborsabile: !form.non_rimborsabile })}
          className={`mt-3 w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all ${
            form.non_rimborsabile
              ? "border-tv-bordeaux bg-tv-bordeaux/10 text-tv-green-deep"
              : "border-tv-green-deep/15 bg-white text-tv-green-deep/50 hover:border-tv-green-deep/30"
          }`}
        >
          <span className="font-bold text-sm">⚠️ Contributo non rimborsabile</span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            form.non_rimborsabile ? "bg-tv-bordeaux text-tv-cream" : "bg-tv-green-deep/10 text-tv-green-deep/50"
          }`}>
            {form.non_rimborsabile ? "Attivo" : "Non attivo"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, solo_soci: !form.solo_soci })}
          className={`mt-3 w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all ${
            form.solo_soci
              ? "border-tv-sky bg-tv-sky/20 text-tv-green-deep"
              : "border-tv-green-deep/15 bg-white text-tv-green-deep/50 hover:border-tv-green-deep/30"
          }`}
        >
          <span className="font-bold text-sm">👥 Riservato ai soci tesserati</span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            form.solo_soci ? "bg-tv-sky text-tv-green-deep" : "bg-tv-green-deep/10 text-tv-green-deep/50"
          }`}>
            {form.solo_soci ? "Attivo" : "Non attivo"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, contributo_volontario: !form.contributo_volontario })}
          className={`mt-3 w-full flex items-center justify-between px-5 py-3 rounded-2xl border-2 transition-all ${
            form.contributo_volontario
              ? "border-tv-green bg-tv-green/10 text-tv-green-deep"
              : "border-tv-green-deep/15 bg-white text-tv-green-deep/50 hover:border-tv-green-deep/30"
          }`}
        >
          <span className="font-bold text-sm">💚 Contributo volontario all'associazione</span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            form.contributo_volontario ? "bg-tv-green text-tv-cream" : "bg-tv-green-deep/10 text-tv-green-deep/50"
          }`}>
            {form.contributo_volontario ? "Attivo" : "Non attivo"}
          </span>
        </button>
        <div className="mt-4 p-4 rounded-2xl border border-tv-green-deep/15 bg-white space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/60">Domanda personalizzata (opzionale)</div>
          <input
            type="text"
            value={form.opzioni_label ?? ""}
            onChange={change("opzioni_label")}
            placeholder="Es. Come gestisci il pranzo?"
            className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 text-tv-green-deep outline-none text-sm"
          />
          <textarea
            rows={2}
            value={form.opzioni_custom ?? ""}
            onChange={change("opzioni_custom")}
            placeholder="Opzioni separate da virgola&#10;Es. Porto pranzo autonomo, Partecipo al pranzo condiviso"
            className="w-full px-4 py-3 rounded-2xl bg-tv-cream/40 border border-tv-green-deep/15 text-tv-green-deep outline-none resize-none text-sm"
          />
        </div>
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-2">Immagine evento</div>
          {currentImageSrc && (
            <div className="relative mb-3">
              <img src={currentImageSrc} alt="Preview" className="w-full h-44 object-cover rounded-2xl" />
              <button
                type="button"
                onClick={() => { setImageData(null); setImageRemoved(true); }}
                className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
                title="Rimuovi immagine"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-tv-green-deep/20 text-tv-green-deep/60 text-sm cursor-pointer hover:border-tv-green-deep/40 hover:text-tv-green-deep/80 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            📷 {currentImageSrc ? "Sostituisci immagine" : "Carica immagine"}
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={saving} className="btn-tv flex-1 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60">{saving ? "Salvo…" : "Salva"}</button>
          <button type="button" onClick={onClose} className="px-5 py-4 rounded-full bg-white border border-tv-green-deep/15 text-tv-green-deep font-bold">Annulla</button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, type = "text", value, onChange, required }) => (
  <label className="block">
    <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">{label}</div>
    <input type={type} value={value ?? ""} onChange={onChange} required={required} className="w-full h-[50px] px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep outline-none appearance-none" />
  </label>
);

// ── MissionsManager ──────────────────────────────────────────────────────────

// ─── DonationsManager ─────────────────────────────────────────────────────────

const DONATION_STATUS_LABELS = {
  pending:   { label: "In attesa",  cls: "bg-tv-orange/15 text-tv-orange" },
  completed: { label: "Completata", cls: "bg-tv-mint/30 text-tv-green" },
  annullata: { label: "Annullata",  cls: "bg-tv-bordeaux/10 text-tv-bordeaux" },
};

const DonationsManager = ({ donations, token, onReload }) => {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [filter, setFilter] = useState("all");
  const [editNote, setEditNote] = useState({});

  const filtered = filter === "all" ? donations : donations.filter(d => d.status === filter);

  const setStatus = async (id, status) => {
    await axios.put(`${API}/admin/donations/${id}`, { status }, authHeader);
    toast.success("Aggiornato");
    onReload();
  };

  const saveNote = async (id) => {
    await axios.put(`${API}/admin/donations/${id}`, { note: editNote[id] ?? "" }, authHeader);
    toast.success("Nota salvata");
    setEditNote(prev => { const n = { ...prev }; delete n[id + "_open"]; return n; });
    onReload();
  };

  const del = async (id) => {
    if (!window.confirm("Eliminare questa donazione?")) return;
    await axios.delete(`${API}/admin/donations/${id}`, authHeader);
    toast.success("Eliminata");
    onReload();
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Copiato!"); };

  const total = donations.filter(d => d.status === "completed").reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Totali", value: donations.length, cls: "text-tv-green-deep" },
          { label: "In attesa", value: donations.filter(d => d.status === "pending").length, cls: "text-tv-orange" },
          { label: "Completate", value: donations.filter(d => d.status === "completed").length, cls: "text-tv-green" },
          { label: "Raccolte", value: `${total.toFixed(0)} €`, cls: "text-tv-bordeaux" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-tv-green-deep/8 text-center">
            <div className={`font-black text-2xl ${cls}`}>{value}</div>
            <div className="text-xs text-tv-green-deep/40 uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div className="flex gap-2 flex-wrap">
        {[["all", "Tutte"], ["pending", "In attesa"], ["completed", "Completate"], ["annullata", "Annullate"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === k ? "bg-tv-green-deep text-tv-cream" : "bg-white border border-tv-green-deep/15 text-tv-green-deep/60 hover:text-tv-green-deep"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-tv-green-deep/30">
          <Heart size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nessuna donazione trovata.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(d => {
            const st = DONATION_STATUS_LABELS[d.status] || DONATION_STATUS_LABELS.pending;
            const noteOpen = editNote[d.id + "_open"];
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-tv-green-deep/8 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Info donatore */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-tv-green-deep">{d.first_name} {d.last_name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      {d.metodo_pagamento === "bonifico"
                        ? <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tv-sky/40 text-tv-green-deep">Bonifico</span>
                        : <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tv-mint/30 text-tv-green">SumUp</span>
                      }
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-tv-green-deep/60 mb-2">
                      <a href={`mailto:${d.email}`} className="hover:text-tv-green-deep">{d.email}</a>
                      {d.phone && <span>{d.phone}</span>}
                      <span>{new Date(d.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    {d.amount && (
                      <div className="text-lg font-black text-tv-bordeaux">{d.amount} €</div>
                    )}
                    {d.message && (
                      <p className="mt-2 text-sm text-tv-green-deep/50 italic bg-tv-cream rounded-xl px-3 py-2">"{d.message}"</p>
                    )}
                    {d.note && !noteOpen && (
                      <p className="mt-2 text-xs text-tv-green-deep/40 bg-tv-green-deep/5 rounded-xl px-3 py-2">📝 {d.note}</p>
                    )}
                    {noteOpen && (
                      <div className="mt-2 flex gap-2">
                        <input value={editNote[d.id] ?? d.note ?? ""} onChange={e => setEditNote(p => ({ ...p, [d.id]: e.target.value }))}
                          placeholder="Aggiungi una nota…"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-tv-green-deep/15 text-sm text-tv-green-deep focus:outline-none focus:border-tv-green" />
                        <button onClick={() => saveNote(d.id)} className="px-3 py-1.5 bg-tv-green-deep text-tv-cream text-xs font-bold rounded-xl">Salva</button>
                      </div>
                    )}
                    {/* IBAN reminder per bonifico */}
                    {d.status === "pending" && d.metodo_pagamento === "bonifico" && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-tv-green-deep/40">
                        <span>IBAN: <span className="font-mono font-bold">IT48E3688801600100000059432</span></span>
                        <button onClick={() => copy("IT48E3688801600100000059432")} className="p-0.5 hover:text-tv-green-deep">
                          <Copy size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Azioni */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    {d.status !== "completed" && (
                      <button onClick={() => setStatus(d.id, "completed")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-mint/30 text-tv-green text-xs font-bold rounded-full hover:bg-tv-mint/50 transition-colors">
                        <Check size={12} /> Confermata
                      </button>
                    )}
                    {d.status === "completed" && (
                      <button onClick={() => setStatus(d.id, "pending")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-green-deep/5 text-tv-green-deep/50 text-xs font-bold rounded-full hover:bg-tv-green-deep/10 transition-colors">
                        In attesa
                      </button>
                    )}
                    <button onClick={() => setEditNote(p => ({ ...p, [d.id + "_open"]: !p[d.id + "_open"], [d.id]: p[d.id] ?? d.note ?? "" }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-sky/30 text-tv-green-deep text-xs font-bold rounded-full hover:bg-tv-sky/50 transition-colors">
                      📝 Nota
                    </button>
                    <button onClick={() => del(d.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-bordeaux/8 text-tv-bordeaux text-xs font-bold rounded-full hover:bg-tv-bordeaux/15 transition-colors">
                      <Trash2 size={12} /> Elimina
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── MissionsManager ──────────────────────────────────────────────────────────

const MISSION_EMPTY = { title: "", description: "", reward: "", required_events: 1, emoji: "🏆", event_id: "", event_title: "", category: "", order: 0, active: true };

const MissionsManager = ({ missions, events, token, onReload }) => {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(MISSION_EMPTY);
  const [editing, setEditing] = useState(null); // mission id being edited inline
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const availableCategories = [...new Set((events || []).map(e => e.category).filter(Boolean))].sort();
  const sortedEvents = [...(events || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/admin/missions`, { ...form, required_events: Number(form.required_events), order: Number(form.order) }, authHeader);
      toast.success("Missione creata!");
      setForm(MISSION_EMPTY);
      setShowForm(false);
      onReload();
    } catch { toast.error("Errore nella creazione"); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async id => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/missions/${id}`, {
        ...editForm,
        required_events: Number(editForm.required_events),
        order: Number(editForm.order),
      }, authHeader);
      toast.success("Salvato!");
      setEditing(null);
      onReload();
    } catch { toast.error("Errore nel salvataggio"); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Eliminare questa missione?")) return;
    await axios.delete(`${API}/admin/missions/${id}`, authHeader);
    toast.success("Missione eliminata");
    onReload();
  };

  const toggleActive = async (m) => {
    await axios.put(`${API}/admin/missions/${m.id}`, { active: !m.active }, authHeader);
    onReload();
  };

  const fieldCls = "w-full px-3 py-2 rounded-xl border border-tv-green-deep/15 text-sm text-tv-green-deep bg-white outline-none focus:border-tv-green";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-black text-2xl text-tv-green-deep">Missioni soci</h2>
          <p className="text-sm text-tv-green-deep/50 mt-0.5">I soci sbloccano i premi raggiungendo i traguardi di partecipazione agli eventi.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green transition-colors whitespace-nowrap">
          <Plus size={15} /> Nuova missione
        </button>
      </div>

      {/* Form nuova missione */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-3xl border border-tv-green-deep/10 p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2 grid grid-cols-[60px_1fr] gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">Emoji</label>
              <input value={form.emoji} onChange={set("emoji")} className={fieldCls} maxLength={4} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">Titolo *</label>
              <input value={form.title} onChange={set("title")} required className={fieldCls} placeholder="Es. Primo filo" />
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">Descrizione</label>
            <input value={form.description} onChange={set("description")} className={fieldCls} placeholder="Es. Hai partecipato al tuo primo evento!" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">Premio / Gadget *</label>
            <input value={form.reward} onChange={set("reward")} required className={fieldCls} placeholder="Es. Segnalibro Trama Viva" />
          </div>
          {/* Tipo condizione */}
          <div className="col-span-1 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-2">Condizione sblocco *</label>
            <div className="flex gap-2 mb-3">
              {[["all","Tutti gli eventi"],["event","Evento specifico"],["category","Tipologia"]].map(([v,l]) => {
                const active = v === "all" ? (!form.event_id && !form.category) : v === "event" ? !!form.event_id : !!form.category;
                return (
                  <button key={v} type="button"
                    onClick={() => setForm(f => ({ ...f, event_id: "", event_title: "", category: "" }))}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${active ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "border-tv-green-deep/20 text-tv-green-deep/60 hover:border-tv-green-deep/40"}`}>
                    {l}
                  </button>
                );
              })}
            </div>
            {/* Evento specifico */}
            {form.event_id !== undefined && (
              <>
                <select value={form.event_id} onChange={e => {
                  const ev = sortedEvents.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, event_id: e.target.value, event_title: ev?.title || "", required_events: 1 }));
                }} className={fieldCls}>
                  <option value="">— seleziona evento specifico —</option>
                  {sortedEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} ({ev.date ? new Date(ev.date).toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) : ""})</option>
                  ))}
                </select>
                {form.event_id && (
                  <p className="text-[10px] text-tv-green-deep/40 mt-1">La missione si sblocca se il socio ha partecipato a questo evento.</p>
                )}
              </>
            )}
            {/* Tipologia */}
            {!form.event_id && availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {availableCategories.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat, event_id: "", event_title: "" }))}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${form.category === cat ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "border-tv-green-deep/20 text-tv-green-deep/60 hover:border-tv-green-deep/50"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Numero eventi (solo se non è evento specifico) */}
          {!form.event_id && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">Eventi richiesti *</label>
              <input type="number" min={1} value={form.required_events} onChange={set("required_events")} required className={fieldCls} />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 block mb-1">Ordine</label>
            <input type="number" min={0} value={form.order} onChange={set("order")} className={fieldCls} />
          </div>
          <div className="col-span-1 sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-full border border-tv-green-deep/20 text-sm font-semibold text-tv-green-deep/60 hover:border-tv-green-deep/40 transition-colors">
              Annulla
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Crea missione
            </button>
          </div>
        </form>
      )}

      {/* Lista missioni */}
      {missions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-tv-green-deep/10 p-10 text-center text-tv-green-deep/40">
          <Trophy size={32} className="mx-auto mb-2 opacity-30" />
          <p>Nessuna missione ancora. Creane una!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {missions.map(m => (
            <div key={m.id} className={`bg-white rounded-3xl border overflow-hidden transition-opacity ${m.active ? "border-tv-green-deep/10" : "border-tv-green-deep/5 opacity-60"}`}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl leading-none shrink-0">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-bold text-tv-green-deep">{m.title}</span>
                      {!m.active && <span className="text-[10px] font-bold text-tv-green-deep/40 italic bg-tv-green-deep/5 px-2 py-0.5 rounded-full">inattiva</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-tv-orange/15 text-tv-orange px-2 py-0.5 rounded-full">
                        {m.required_events} {m.required_events === 1 ? "evento" : "eventi"}
                      </span>
                      {m.category && (
                        <span className="text-[10px] font-bold bg-tv-sky/20 text-tv-green-deep/60 px-2 py-0.5 rounded-full">
                          {m.category}
                        </span>
                      )}
                    </div>
                    {m.description && <p className="text-xs text-tv-green-deep/50 line-clamp-2">{m.description}</p>}
                    <p className="text-xs font-semibold text-tv-green-deep/70 mt-1">🎁 {m.reward}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-tv-green-deep/8">
                  <button onClick={() => toggleActive(m)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${m.active ? "bg-tv-mint/30 text-tv-green-deep hover:bg-tv-mint/50" : "bg-tv-green-deep/8 text-tv-green-deep/50 hover:bg-tv-green-deep/15"}`}>
                    {m.active ? "✓ Attiva" : "Attiva"}
                  </button>
                  <button onClick={() => { setEditing(m.id); setEditForm({ ...m }); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-tv-sky/20 text-tv-green-deep text-xs font-bold hover:bg-tv-sky/40 transition-colors">
                    <Pencil size={12}/> Modifica
                  </button>
                  <button onClick={() => handleDelete(m.id)}
                    className="px-4 py-2 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux text-xs font-bold hover:bg-tv-bordeaux/20 transition-colors flex items-center gap-1">
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>

              {/* Inline edit */}
              {editing === m.id && (
                <div className="border-t border-tv-green-deep/10 bg-tv-cream/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2 grid grid-cols-[60px_1fr] gap-3">
                    <input value={editForm.emoji || ""} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))} className={fieldCls} maxLength={4} />
                    <input value={editForm.title || ""} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className={fieldCls} placeholder="Titolo" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <input value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className={fieldCls} placeholder="Descrizione" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <input value={editForm.reward || ""} onChange={e => setEditForm(f => ({ ...f, reward: e.target.value }))} className={fieldCls} placeholder="Premio / Gadget" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 block mb-1">Evento specifico</label>
                    <select value={editForm.event_id || ""} onChange={e => {
                      const ev = sortedEvents.find(x => x.id === e.target.value);
                      setEditForm(f => ({ ...f, event_id: e.target.value, event_title: ev?.title || "", category: e.target.value ? "" : f.category }));
                    }} className={fieldCls}>
                      <option value="">— nessun evento specifico —</option>
                      {sortedEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                    {!editForm.event_id && (
                      <>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-tv-green-deep/40 block mt-2 mb-1">Oppure tipologia</label>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => setEditForm(f => ({ ...f, category: "" }))}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${!editForm.category ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "border-tv-green-deep/20 text-tv-green-deep/50"}`}>
                            Tutti
                          </button>
                          {availableCategories.map(cat => (
                            <button key={cat} type="button"
                              onClick={() => setEditForm(f => ({ ...f, category: cat }))}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${editForm.category === cat ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "border-tv-green-deep/20 text-tv-green-deep/60 hover:border-tv-green-deep/50"}`}>
                              {cat}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <input type="number" min={1} value={editForm.required_events || 1} onChange={e => setEditForm(f => ({ ...f, required_events: e.target.value }))} className={fieldCls} />
                  <input type="number" min={0} value={editForm.order || 0} onChange={e => setEditForm(f => ({ ...f, order: e.target.value }))} className={fieldCls} placeholder="Ordine" />
                  <div className="col-span-1 sm:col-span-2 flex justify-end gap-2">
                    <button onClick={() => setEditing(null)}
                      className="px-4 py-1.5 rounded-full border border-tv-green-deep/20 text-sm font-semibold text-tv-green-deep/60 hover:border-tv-green-deep/40 transition-colors">
                      Annulla
                    </button>
                    <button onClick={() => handleSaveEdit(m.id)} disabled={saving}
                      className="px-4 py-1.5 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green transition-colors disabled:opacity-50 flex items-center gap-2">
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salva
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MembersManager = ({ members, registrations, onEdit, onDelete }) => {
  const fmtDay = (d) => {
    try { return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const [sortField, setSortField] = useState("tessera");
  const [memberSearch, setMemberSearch] = useState("");

  const founders = members.filter(m => !m.tessera_number);
  const numbered = members.filter(m => m.tessera_number);

  const sorted = useMemo(() => {
    let list = [...members];
    if (memberSearch.trim()) {
      const q = memberSearch.trim().toLowerCase();
      list = list.filter(m =>
        (`${m.first_name || ""} ${m.last_name || ""}`).toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.tessera_number || "").includes(q)
      );
    }
    if (sortField === "name") return list.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "it"));
    if (sortField === "date") return list.sort((a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0));
    // default: tessera — numbered first ascending, then founders alphabetically
    const num = list.filter(m => m.tessera_number).sort((a, b) => parseInt(a.tessera_number) - parseInt(b.tessera_number));
    const fnd = list.filter(m => !m.tessera_number).sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "it"));
    return [...num, ...fnd];
  }, [members, sortField, memberSearch]);

  const tessereNumeri = numbered.map(m => parseInt(m.tessera_number)).filter(n => !isNaN(n));
  const regRiservate = (registrations || [])
    .filter(r => r.tessera_number && r.status !== "approved")
    .map(r => parseInt(r.tessera_number)).filter(n => !isNaN(n));
  const maxTessera = tessereNumeri.length > 0 ? Math.max(...tessereNumeri) : 0;
  const tessereSet = new Set([...tessereNumeri, ...regRiservate]);
  const lacune = [];
  for (let i = 1; i <= maxTessera; i++) {
    if (!tessereSet.has(i)) lacune.push(i);
  }
  const prossimaLibera = tessereSet.size > 0 ? Math.max(...tessereSet) + 1 : 1;

  return (
    <div data-testid="admin-members-manager">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Soci tesserati", value: numbered.length, cls: "text-tv-green-deep", icon: "🎫" },
          { label: "Fondatori", value: founders.length, cls: "text-amber-700", icon: "⭐" },
          { label: "Prossima tessera", value: `#${prossimaLibera}`, cls: "text-tv-sky", icon: "🔢" },
          { label: "Buchi da assegnare", value: lacune.length, cls: lacune.length > 0 ? "text-tv-bordeaux" : "text-tv-green-deep/30", icon: "🔍" },
        ].map(({ label, value, cls, icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-tv-green-deep/8 text-center">
            <div className="text-xl mb-0.5">{icon}</div>
            <div className={`font-black text-xl ${cls}`}>{value}</div>
            <div className="text-[10px] text-tv-green-deep/40 uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-green-deep/35 pointer-events-none"/>
          <input type="text" placeholder="Cerca per nome, email o tessera…" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-sm text-tv-green-deep"/>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-tv-green-deep/10 flex-1 sm:flex-none">
          <span className="text-[10px] text-tv-green-deep/40 px-2 font-bold uppercase tracking-wider">Ordina</span>
          {[{ key: "tessera", label: "Tessera" }, { key: "name", label: "Nome" }, { key: "date", label: "Data" }].map(s => (
            <button key={s.key} onClick={() => setSortField(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortField === s.key ? "bg-tv-green-deep text-tv-cream" : "text-tv-green-deep/50 hover:text-tv-green-deep"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {members.length > 0 && (
        <div className="mb-5 bg-white rounded-2xl px-4 py-3 border border-tv-green-deep/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-bold text-tv-green-deep shrink-0">📋 Tessere</span>
          {lacune.length > 0 && (
            <span className="flex items-center gap-1 flex-wrap">
              <span className="text-tv-green-deep/60 shrink-0">Buchi da riassegnare:</span>
              {lacune.slice(0, 12).map(n => (
                <span key={n} className="inline-block bg-tv-orange/30 text-tv-green-deep font-bold text-xs px-1.5 py-0.5 rounded">#{n}</span>
              ))}
              {lacune.length > 12 && <span className="text-tv-green-deep/40 text-xs">+{lacune.length - 12} altri</span>}
              <span className="text-tv-green-deep/30 mx-1">·</span>
            </span>
          )}
          {regRiservate.length > 0 && (
            <span className="flex items-center gap-1 flex-wrap">
              <span className="text-tv-green-deep/60 shrink-0">Riservate (in attesa):</span>
              {regRiservate.sort((a,b)=>a-b).map(n => (
                <span key={n} className="inline-block bg-tv-sky/40 text-tv-green-deep font-bold text-xs px-1.5 py-0.5 rounded">#{n}</span>
              ))}
              <span className="text-tv-green-deep/30 mx-1">·</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="text-tv-green-deep/60">Prossima nuova:</span>
            <span className="inline-block bg-tv-sky/60 text-tv-green-deep font-bold text-xs px-2 py-0.5 rounded">#{prossimaLibera}</span>
          </span>
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">Nessun socio nel registro.</div>
      ) : (
        <div className="grid gap-3">
          {sorted.map((m) => {
            const isFounder = !m.tessera_number;
            return (
              <article key={m.id} className="bg-white rounded-3xl p-4 md:p-6 border border-tv-green-deep/10">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-lg shrink-0 ${isFounder ? "bg-amber-400 text-amber-950" : "bg-tv-green text-tv-cream"}`}>
                    {(m.first_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-black text-base text-tv-green-deep">{m.first_name} {m.last_name}</span>
                          {isFounder ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">⭐ Fondatore</span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-tv-orange/30 text-tv-green-deep px-2 py-0.5 rounded-full">Tessera #{m.tessera_number}</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-tv-green-deep/60 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span className="text-tv-green-deep/40 text-[11px]">dal {fmtDay(m.joined_at)}</span>
                          {m.email && <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-tv-bordeaux"><Mail size={11}/> {m.email}</a>}
                          {m.phone && <span>📞 {m.phone}</span>}
                        </div>
                        {m.notes && <p className="mt-1 text-[11px] text-tv-green-deep/40 italic truncate">{m.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => onEdit(m)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-sky/30 text-tv-green-deep text-xs font-bold rounded-full hover:bg-tv-sky transition-colors">
                          <Pencil size={12}/> Modifica
                        </button>
                        <button onClick={() => onDelete(m.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-tv-bordeaux/10 text-tv-bordeaux text-xs font-bold rounded-full hover:bg-tv-bordeaux hover:text-tv-cream transition-colors">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MemberEditor = ({ token, initial, onClose, onSaved }) => {
  const isNew = !initial;
  const [form, setForm] = useState(
    initial || { first_name: "", last_name: "", email: "", phone: "", tessera_number: "", notes: "" }
  );
  const [saving, setSaving] = useState(false);
  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) {
      toast.error("Nome e Cognome sono obbligatori.");
      return;
    }
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (isNew) {
        await axios.post(`${API}/admin/members`, form, { headers });
        toast.success("Socio aggiunto!");
      } else {
        await axios.put(`${API}/admin/members/${initial.id}`, form, { headers });
        toast.success("Dati socio aggiornati!");
      }
      onSaved();
    } catch (err) {
      toast.error("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-tv-green-deep/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-xl bg-tv-cream rounded-[2rem] p-5 md:p-9 my-4 md:my-8 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-tv-bordeaux">{isNew ? "Nuovo Socio" : "Modifica Socio"}</div>
            <h3 className="mt-1 font-display font-black text-xl md:text-2xl text-tv-green-deep">{isNew ? "Aggiungi al Registro" : `${form.first_name} ${form.last_name}`}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full bg-tv-green-deep text-tv-cream hover:bg-tv-green"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome *" value={form.first_name} onChange={change("first_name")} required />
          <Field label="Cognome *" value={form.last_name} onChange={change("last_name")} required />
          <Field label="Email" type="email" value={form.email} onChange={change("email")} />
          <Field label="Telefono" value={form.phone} onChange={change("phone")} />
          <Field label="Numero Tessera" value={form.tessera_number} onChange={change("tessera_number")} className="sm:col-span-2" />
        </div>
        <label className="block mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1">Note / Annotazioni</div>
          <textarea rows={3} value={form.notes} onChange={change("notes")} className="w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep resize-none outline-none" />
        </label>
        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={saving} className="btn-tv flex-1 px-5 py-4 rounded-full bg-tv-green-deep text-tv-cream font-bold disabled:opacity-60">{saving ? "Salvo…" : "Salva Socio"}</button>
          <button type="button" onClick={onClose} className="px-5 py-4 rounded-full bg-white border border-tv-green-deep/15 text-tv-green-deep font-bold">Annulla</button>
        </div>
      </form>
    </div>
  );
};

// ─── Wrapper che gestisce autenticazione ───────────────────
const AdminPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const handleLogin = (t) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
};

export default AdminPage;
