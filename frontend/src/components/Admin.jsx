import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Logo } from "./Logo";
import { LogOut, Trash2, Mail, Users, Calendar, MessageSquare, Lock, ArrowLeft, Plus, Pencil, X, CalendarPlus, IdCard, UserCheck, Sparkles, Download, Loader2, ShieldOff, ChevronDown, ChevronUp, Search, LayoutDashboard, RefreshCw, Menu, PanelLeftClose, BookOpen } from "lucide-react";

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
  { key: "members",       label: "Soci tesserati",       icon: IdCard },
  { key: "registrations", label: "Richieste iscrizione", icon: Users },
  { key: "event-signups", label: "Richieste eventi",     icon: Calendar },
  { key: "contacts",      label: "Messaggi",             icon: MessageSquare },
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!isArchived && <button onClick={() => onPdf(row.id)} disabled={pdfLoadingId === row.id} title="PDF"
                      className="p-1.5 rounded-lg bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky transition-colors">
                      {pdfLoadingId === row.id ? <Loader2 size={13} className="animate-spin"/> : <Download size={13}/>}
                    </button>}
                    {row.email && <button onClick={() => onResend(row)} title="Reinvia email"
                      className="p-1.5 rounded-lg bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky transition-colors">
                      <Mail size={13}/>
                    </button>}
                    {!isArchived && row.metodo_pagamento && <button onClick={() => onTogglePayment(row)}
                      title={row.payment_completed ? "Annulla pagamento" : "Segna pagato"}
                      className={`p-1.5 rounded-lg transition-colors text-xs ${row.payment_completed ? "bg-tv-green/20 text-tv-green-deep" : "bg-tv-orange/20 text-tv-bordeaux"}`}>💸</button>}
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

const BOOK_EMPTY = {
  title: "", author: "", cover_url: "", genre: "", status: "in_lettura",
  reading_month: "", start_date: "", end_date: "", description: "", recensione: "",
  linked_event_ids: [], in_biblioteca: false, is_lent: false, lent_to: "", lent_date: "",
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
        cover_url: form.cover_url.trim() || null,
        genre: form.genre.trim() || null,
        status: form.status,
        reading_month: form.reading_month || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description.trim() || null,
        recensione: form.recensione.trim() || null,
        linked_event_ids: form.linked_event_ids || [],
        in_biblioteca: !!form.in_biblioteca,
        is_lent: !!form.is_lent,
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
              <input className={fieldClass} value={form.genre} onChange={e => set("genre", e.target.value)} placeholder="es. Giallo, Romanzo…" />
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
          <div className="grid sm:grid-cols-3 gap-4">
            <label>
              <div className={labelClass}>Mese lettura (AAAA-MM)</div>
              <input className={fieldClass} value={form.reading_month || ""} onChange={e => set("reading_month", e.target.value)} placeholder="es. 2025-07" />
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
              <input type="checkbox" checked={!!form.is_lent} onChange={e => set("is_lent", e.target.checked)} className="w-4 h-4 accent-tv-bordeaux" />
              <span className="text-sm font-bold text-tv-bordeaux">In prestito (Libro sospeso)</span>
            </label>
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

          {events && events.length > 0 && (
            <div>
              <div className={labelClass}>Collega a eventi</div>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {events.map(ev => (
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

// ── Sottosezione Prestiti ────────────────────────────────────────────────────
const LoanManager = ({ books, token, onReload }) => {
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ book_id: "", lent_to: "", lent_date: "" });
  const [saving, setSaving] = useState(false);

  const lentBooks = books.filter(b => b.is_lent);
  const availableBooks = books.filter(b => !b.is_lent);

  const handleReturn = async (book) => {
    try {
      await axios.put(`${API}/admin/books/${book.id}`, { is_lent: false, lent_to: null, lent_date: null }, authHeader);
      toast.success("Libro segnato come restituito.");
      onReload();
    } catch { toast.error("Errore."); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.book_id || !form.lent_to.trim()) { toast.error("Seleziona il libro e inserisci il nome."); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/admin/books/${form.book_id}`, {
        is_lent: true,
        lent_to: form.lent_to.trim(),
        lent_date: form.lent_date || null,
      }, authHeader);
      toast.success("Prestito registrato.");
      setForm({ book_id: "", lent_to: "", lent_date: "" });
      setAdding(false);
      onReload();
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  const fieldClass = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-tv-green-deep text-sm";

  return (
    <div className="space-y-6">
      {/* Header + bottone aggiungi */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-xl text-tv-green-deep">Libri in prestito</h3>
          <p className="text-sm text-tv-green-deep/50 mt-0.5">Libri attualmente fuori sede — "Libri sospesi"</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm hover:bg-tv-bordeaux/80 transition-colors"
        >
          <Plus size={15} /> Registra prestito
        </button>
      </div>

      {/* Form aggiunta prestito */}
      {adding && (
        <form onSubmit={handleAdd} className="rounded-2xl border border-tv-bordeaux/20 bg-tv-bordeaux/5 p-5 grid gap-4">
          <div className="text-sm font-black text-tv-bordeaux uppercase tracking-wider">Nuovo prestito</div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Libro</label>
              <select className={fieldClass} value={form.book_id} onChange={e => setForm(f => ({ ...f, book_id: e.target.value }))} required>
                <option value="">Scegli…</option>
                {availableBooks.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Prestato a</label>
              <input className={fieldClass} value={form.lent_to} onChange={e => setForm(f => ({ ...f, lent_to: e.target.value }))} placeholder="Nome lettore" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-tv-green-deep/50 mb-1">Data prestito</label>
              <input type="date" className={fieldClass} value={form.lent_date} onChange={e => setForm(f => ({ ...f, lent_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2.5 rounded-full border border-tv-green-deep/20 text-tv-green-deep font-bold text-sm">Annulla</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm disabled:opacity-60">{saving ? "Salvo…" : "Conferma prestito"}</button>
          </div>
        </form>
      )}

      {/* Lista prestiti attivi */}
      {lentBooks.length === 0 ? (
        <div className="rounded-2xl bg-white border border-tv-green-deep/10 p-8 text-center text-tv-green-deep/40">
          Nessun libro in prestito al momento.
        </div>
      ) : (
        <div className="grid gap-3">
          {lentBooks.map(book => (
            <div key={book.id} className="bg-white rounded-2xl border border-tv-bordeaux/15 p-4 flex items-center gap-4">
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
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-tv-green-deep/60">
                  {book.lent_to && <span>👤 {book.lent_to}</span>}
                  {book.lent_date && <span>📅 dal {fmtDay(book.lent_date)}</span>}
                </div>
              </div>
              <button
                onClick={() => handleReturn(book)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-green/20 text-tv-green-deep font-bold text-xs hover:bg-tv-green/40 transition-colors"
              >
                ✓ Restituito
              </button>
            </div>
          ))}
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
  const reviewCount = reviews?.length || 0;
  const proposalCount = proposals?.length || 0;

  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Eliminare questa proposta?")) return;
    try {
      await axios.delete(`${API}/admin/proposals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Proposta eliminata.");
      onReload();
    } catch { toast.error("Errore nell'eliminazione."); }
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
        {tabBtn("recensioni", "Recensioni", reviewCount)}
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
            {books.map(book => {
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

      {/* ── Recensioni ── */}
      {subTab === "recensioni" && (
        <div>
          <h3 className="font-display font-black text-xl text-tv-green-deep mb-5">Recensioni dei lettori</h3>
          {(reviews || []).length === 0 ? (
            <div className="rounded-2xl bg-white border border-tv-green-deep/10 p-8 text-center text-tv-green-deep/40">
              Nessuna recensione ancora.
            </div>
          ) : (
            <div className="grid gap-3">
              {(reviews || []).map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-tv-green-deep/10 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-tv-green-deep text-sm">{r.reviewer_name}</span>
                      <span className="text-xs text-tv-bordeaux/70">su «{r.book_title}»</span>
                      <span className="text-xs text-tv-green-deep/35">{fmtDate(r.created_at)}</span>
                      {r.rating && (
                        <span className="text-xs font-bold text-tv-orange">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-tv-green-deep/70 mt-1 leading-snug">{r.content}</p>
                  </div>
                  <button onClick={() => handleDeleteReview(r.id)} className="p-1.5 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Proposte ── */}
      {subTab === "proposte" && (
        <div>
          <h3 className="font-display font-black text-xl text-tv-green-deep mb-5">Proposte dei lettori</h3>
          {(proposals || []).length === 0 ? (
            <div className="rounded-2xl bg-white border border-tv-green-deep/10 p-8 text-center text-tv-green-deep/40">
              Nessuna proposta ancora.
            </div>
          ) : (
            <div className="grid gap-3">
              {[...(proposals || [])].sort((a, b) => b.votes - a.votes).map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-tv-green-deep/10 p-4 flex items-start gap-4">
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
                    {p.description && <p className="text-sm text-tv-green-deep/60 mt-1 leading-snug line-clamp-2">{p.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteProposal(p.id)} className="p-1.5 rounded-full hover:bg-tv-bordeaux/10 text-tv-bordeaux shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
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
      const [r, es, c, ev, mem, bk, rv, pr] = await Promise.all([
        axios.get(`${API}/admin/registrations`, authHeader),
        axios.get(`${API}/admin/event-signups`, authHeader),
        axios.get(`${API}/admin/contacts`, authHeader),
        axios.get(`${API}/admin/events`, authHeader),
        axios.get(`${API}/admin/members`, authHeader),
        axios.get(`${API}/books`, authHeader),
        axios.get(`${API}/admin/reviews`, authHeader),
        axios.get(`${API}/admin/proposals`, authHeader),
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
          {NAV.map((item) => (
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
          ))}
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

// ─── Event signups — master-detail con tabella compatta ──────────────────────

const SignupRow = ({ row, founderEmails, isSelected, onToggleSelect, onConfirm, onTogglePayment, onDelete, isPastEvent }) => {
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
    <div className="flex flex-col md:flex-row rounded-[2rem] border border-tv-green-deep/10 bg-white overflow-hidden md:h-[calc(100vh-200px)] md:min-h-[600px]">

      {/* ── Selezione evento: dropdown (mobile) / sidebar verticale (desktop) ── */}

      {/* Sidebar verticale: lista eventi */}
      <div className="flex flex-shrink-0 w-full md:w-60 xl:w-64 border-b md:border-b-0 md:border-r border-tv-green-deep/10 bg-tv-cream/40 flex-col max-h-48 md:max-h-none overflow-y-auto">
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

      {/* ── Colonna destra: dettaglio ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
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
                {/* Stats chips */}
                <div className="flex items-center gap-2 flex-wrap">
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
              <div className="px-3 md:px-6 py-3 border-b border-tv-green-deep/10 flex-shrink-0 flex flex-wrap items-center gap-2 md:gap-3">
                <div className="overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1 bg-tv-cream rounded-xl p-1 w-max">
                    {[
                      { key: "all", label: `Tutti (${isPastEvent ? allItems.filter(r=>r.confirmed).length : allItems.length})` },
                      ...(!isPastEvent ? [{ key: "pending", label: `In attesa (${pendingCount})` }] : []),
                      { key: "confirmed", label: `Confermati (${allItems.filter(r=>r.confirmed).length})` },
                    ].map(f => (
                      <button key={f.key} onClick={() => setActiveFilter(f.key)}
                        className={`px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          activeFilter === f.key ? "bg-tv-green-deep text-tv-cream shadow-sm" : "text-tv-green-deep/50 hover:text-tv-green-deep"
                        }`}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
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
                          <div key={row.id} className={`rounded-2xl border p-3 min-w-0 ${
                            selectedIds.has(row.id) ? "border-tv-green/50 bg-tv-green/5"
                            : row.confirmed ? "bg-white border-tv-green-deep/10"
                            : "bg-amber-50 border-tv-orange/20"
                          }`}>
                            <div className="flex items-start gap-2 mb-2">
                              {!isPastEvent && (
                                <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)}
                                  className="mt-1 w-4 h-4 accent-tv-green cursor-pointer shrink-0"/>
                              )}
                              <div className="w-8 h-8 rounded-lg bg-tv-green-deep text-tv-cream flex items-center justify-center font-black text-sm shrink-0">
                                {(row.name?.[0] || "?").toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-sm text-tv-green-deep">{row.name}</span>
                                  {isFounder && <span className="text-[9px] font-bold uppercase bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full">Fondatore</span>}
                                  {row.is_member && !isFounder && <span className="text-[9px] font-bold uppercase bg-tv-green text-tv-cream px-1.5 py-0.5 rounded-full">Socio</span>}
                                </div>
                                {row.message && <p className="text-[11px] text-tv-green-deep/40 italic truncate">"{row.message}"</p>}
                              </div>
                              <div className="shrink-0">
                                {row.confirmed
                                  ? <span className="text-[10px] font-bold bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full whitespace-nowrap">✓ Conf.</span>
                                  : <span className="text-[10px] font-bold bg-tv-orange/15 text-tv-bordeaux px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Attesa</span>}
                              </div>
                            </div>
                            <div className="space-y-1 mb-2 pl-10 text-xs text-tv-green-deep/60">
                              {row.email && <a href={`mailto:${row.email}`} className="flex items-center gap-1 hover:text-tv-bordeaux min-w-0"><Mail size={10} className="shrink-0"/><span className="truncate">{row.email}</span></a>}
                              {row.phone && <div>📞 {row.phone}</div>}
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <span>👥 {row.num_persone || 1} {(row.num_persone || 1) > 1 ? "persone" : "persona"}</span>
                                {row.opzione_scelta && <span className="text-tv-green-deep/50">{row.opzione_scelta}</span>}
                              </div>
                              {(row.metodo_pagamento || row.donazione_volontaria > 0) && (
                                <div className="flex flex-wrap gap-1">
                                  {row.donazione_volontaria > 0 && <span className="text-[10px] font-bold bg-tv-green/15 text-tv-green-deep px-2 py-0.5 rounded-full">💚 {row.donazione_volontaria}€</span>}
                                  {row.metodo_pagamento && (row.payment_completed
                                    ? <span className="text-[10px] font-bold bg-tv-green/15 text-tv-green-deep px-2 py-0.5 rounded-full">✓ {row.metodo_pagamento}</span>
                                    : <span className="text-[10px] font-bold bg-tv-orange/20 text-tv-bordeaux px-2 py-0.5 rounded-full">⏳ {row.metodo_pagamento}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 pl-10">
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
                              <button onClick={() => onDelete(row.id)} title="Elimina"
                                className="p-1.5 rounded-lg bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors">
                                <Trash2 size={13}/>
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
      const payload = { ...form, spots: Number(form.spots) || 20 };
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
      <div className="flex items-center justify-end flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-tv-green/20 text-tv-green-deep font-bold text-xs">
            <Users size={13} /> {numbered.length} soci
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
            ⭐ {founders.length} fondatori
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-green-deep/35 pointer-events-none"/>
          <input type="text" placeholder="Cerca per nome, email o tessera…" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-tv-green-deep/15 focus:border-tv-green outline-none text-sm text-tv-green-deep"/>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-tv-green-deep/10">
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
              <article key={m.id} className="bg-white rounded-3xl p-5 md:p-6 border border-tv-green-deep/10 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-black text-lg ${isFounder ? "bg-amber-400 text-amber-950" : "bg-tv-green text-tv-cream"}`}>
                    {(m.first_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-black text-lg text-tv-green-deep">{m.first_name} {m.last_name}</span>
                      {isFounder ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full">⭐ Socio Fondatore</span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-tv-orange text-tv-green-deep px-2 py-0.5 rounded-full">Tessera #{m.tessera_number}</span>
                      )}
                      <span className="text-xs text-tv-green-deep/50">dal {fmtDay(m.joined_at)}</span>
                    </div>
                    <div className="mt-1 text-sm text-tv-green-deep/80 flex flex-wrap gap-x-4 gap-y-1">
                      {m.email && <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-tv-bordeaux"><Mail size={13} /> {m.email}</a>}
                      {m.phone && <span>📞 {m.phone}</span>}
                      {m.notes && <span className="text-tv-green-deep/50 italic truncate max-w-xs">{m.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button onClick={() => onEdit(m)} className="p-2.5 rounded-full bg-tv-sky/30 text-tv-green-deep hover:bg-tv-sky"><Pencil size={16} /></button>
                  <button onClick={() => onDelete(m.id)} className="p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream"><Trash2 size={16} /></button>
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
