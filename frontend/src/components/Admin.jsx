import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Logo } from "./Logo";
import { LogOut, Trash2, Mail, Users, Calendar, MessageSquare, Lock, ArrowLeft, Plus, Pencil, X, CalendarPlus, IdCard, UserCheck, Sparkles, Download, Loader2, ShieldOff, ChevronDown, ChevronUp } from "lucide-react";

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

const TABS = [
  { key: "events", label: "Eventi", icon: CalendarPlus },
  { key: "members", label: "Soci tesserati", icon: IdCard },
  { key: "registrations", label: "Richieste iscrizione", icon: Users },
  { key: "event-signups", label: "Richieste eventi", icon: Calendar },
  { key: "contacts", label: "Messaggi contatti", icon: MessageSquare },
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

const Dashboard = ({ token, onLogout }) => {
  const [tab, setTab] = useState("events");
  const [data, setData] = useState({
    registrations: [], "event-signups": [], contacts: [], events: [], members: [],
  });
  const [loading, setLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [eventEditor, setEventEditor] = useState(null);
  const [memberEditor, setMemberEditor] = useState(null);

  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadAll = async () => {
    if (!token) {
      setLoading(false);
      if (typeof onLogout === "function") onLogout();
      return;
    }

    setLoading(true);
    try {
      const [r, es, c, ev, mem] = await Promise.all([
        axios.get(`${API}/admin/registrations`, authHeader),
        axios.get(`${API}/admin/event-signups`, authHeader),
        axios.get(`${API}/admin/contacts`, authHeader),
        axios.get(`${API}/admin/events`, authHeader),
        axios.get(`${API}/admin/members`, authHeader),
      ]);
      setData({
        registrations: r.data || [],
        "event-signups": es.data || [],
        contacts: c.data || [],
        events: ev.data || [],
        members: mem.data || [],
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
    
  const list = data[tab] || [];

  return (
    <div className="min-h-screen bg-tv-cream">
      <header className="sticky top-0 z-40 bg-tv-cream/90 backdrop-blur-xl border-b border-tv-green-deep/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3" data-testid="admin-home-link">
            <Logo variant="inline" size={38} />
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={exportXlsx}
              data-testid="admin-export-xlsx"
              className="btn-tv hidden sm:inline-flex px-4 py-2 rounded-full bg-tv-orange text-tv-green-deep font-bold text-sm"
            >
              Esporta Excel
            </button>
            <button
              onClick={onLogout}
              data-testid="admin-logout"
              className="btn-tv inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-bordeaux text-tv-cream font-bold text-sm"
            >
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display font-black text-4xl md:text-5xl text-tv-green-deep mb-1">
          Dashboard
        </h1>
        <p className="text-tv-green-deep/70 mb-8">
          Tutte le richieste e i messaggi dell'associazione.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`admin-tab-${t.key}`}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                tab === t.key
                  ? "bg-tv-green-deep text-tv-cream"
                  : "bg-white text-tv-green-deep/70 hover:bg-tv-sky/30 border border-tv-green-deep/10"
              }`}
            >
              <t.icon size={16} />
              {t.label}
              <span className="opacity-70">({data[t.key]?.length ?? 0})</span>
            </button>
          ))}
        </div>

        {loading ? (
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
        ) : tab === "members" ? (
          <MembersManager
            members={data.members}
            onCreate={() => setMemberEditor("new")}
            onEdit={(m) => setMemberEditor(m)}
            onDelete={(id) => remove("members", id)}
          />
        ) : tab === "registrations" ? (
          list.length === 0 ? (
            <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60" data-testid="admin-empty">
              Ancora niente qui. Quando qualcuno invierà un modulo, lo vedrai apparire.
            </div>
          ) : (
            <div className="grid gap-4" data-testid="admin-list">
              {list.map(row => (
                <RegistrationCard
                  key={row.id}
                  row={row}
                  onPdf={downloadPdf}
                  pdfLoadingId={pdfLoadingId}
                  onTogglePayment={togglePayment}
                  onApprove={promoteToMember}
                  onCleanup={cleanupRegistration}
                  onResend={resendEmail}
                  onDelete={(id) => remove("registrations", id)}
                />
              ))}
            </div>
          )
        ) : tab === "event-signups" ? (
          <EventSignupsManager
            signups={data["event-signups"]}
            members={data.members}
            events={data.events}
            onConfirm={confirmSignup}
            onDelete={(id) => remove("event-signups", id)}
            onTogglePayment={toggleEventPayment}
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
                      onClick={() => downloadPdf(row.id)}
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
      </main>

      {eventEditor && (
        <EventEditor
          token={token}
          initial={eventEditor === "new" ? null : eventEditor}
          onClose={() => setEventEditor(null)}
          onSaved={() => { setEventEditor(null); loadAll(); }}
        />
      )}
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

// ─── Event signups raggruppati per evento ─────────────────────────────────────

const EventSignupsManager = ({ signups, members, events, onConfirm, onDelete, onTogglePayment }) => {
  const [closedGroups, setClosedGroups] = React.useState(() => {
    const evMap = {};
    (events || []).forEach(ev => { evMap[ev.id] = ev; });
    const pastKeys = new Set();
    (signups || []).forEach(s => {
      const key = s.event_id || s.event_title || "—";
      const ev = evMap[s.event_id];
      if (ev && isPast(ev.date)) pastKeys.add(key);
    });
    return pastKeys;
  });

  const toggleGroup = (key) => setClosedGroups(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const founderEmails = new Set(
    (members || []).filter(m => !m.tessera_number).map(m => (m.email || "").toLowerCase())
  );

  if (!signups || signups.length === 0) {
    return (
      <div className="rounded-[2rem] p-10 bg-white border border-tv-green-deep/10 text-center text-tv-green-deep/60">
        Ancora nessuna richiesta evento.
      </div>
    );
  }

  const grouped = signups.reduce((acc, s) => {
    const key = s.event_id || s.event_title || "—";
    if (!acc[key]) acc[key] = { title: s.event_title || s.event_id || "Evento sconosciuto", items: [] };
    acc[key].items.push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([key, group]) => {
        const isOpen = !closedGroups.has(key);
        return (
        <div key={key}>
          <button
            onClick={() => toggleGroup(key)}
            className="w-full flex items-center gap-3 mb-4 pb-3 border-b-2 border-tv-green-deep/10 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-tv-sky/40 flex items-center justify-center text-lg flex-shrink-0">📅</div>
            <h3 className="font-display font-black text-xl text-tv-green-deep flex-1 leading-tight">{group.title}</h3>
            <span className="px-3 py-1 rounded-full bg-tv-sky/30 text-tv-green-deep font-bold text-xs flex-shrink-0">
              {group.items.length} {group.items.length === 1 ? "richiesta" : "richieste"}
            </span>
            <span className="text-tv-green-deep/40 flex-shrink-0">
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>
          {isOpen && <div className="grid gap-3">
            {group.items.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-2xl p-4 border border-tv-green-deep/10 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-tv-green-deep text-tv-cream flex items-center justify-center font-display font-black text-base flex-shrink-0">
                  {(row.name?.[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-tv-green-deep">{row.name}</span>
                    {row.is_member && founderEmails.has((row.email || "").toLowerCase()) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                        <UserCheck size={10} /> Socio Fondatore
                      </span>
                    ) : row.is_member ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green text-tv-cream px-2 py-0.5 rounded-full">
                        <UserCheck size={10} /> Socio
                      </span>
                    ) : null}
                    {row.confirmed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full">
                        ✓ Confermato
                      </span>
                    )}
                    {row.num_persone > 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-sky/30 text-tv-green-deep px-2 py-0.5 rounded-full">
                        👥 {row.num_persone} persone
                      </span>
                    )}
                    {row.opzione_scelta && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-mint/40 text-tv-green-deep px-2 py-0.5 rounded-full">
                        {row.opzione_scelta}
                      </span>
                    )}
                    {row.donazione_volontaria > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full">
                        💚 Donazione {row.donazione_volontaria}€
                      </span>
                    )}
                    {row.metodo_pagamento && (
                      row.payment_completed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-green/20 text-tv-green-deep px-2 py-0.5 rounded-full">
                          💸 Pagato · {row.metodo_pagamento}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-tv-orange/30 text-tv-green-deep px-2 py-0.5 rounded-full">
                          ⏳ {row.metodo_pagamento} · da ricevere
                        </span>
                      )
                    )}
                    <span className="text-xs text-tv-green-deep/40">{fmtDate(row.created_at)}</span>
                  </div>
                  <div className="text-sm text-tv-green-deep/60 flex flex-wrap gap-x-3 mt-0.5">
                    {row.email && <a href={`mailto:${row.email}`} className="hover:text-tv-bordeaux flex items-center gap-1"><Mail size={12} />{row.email}</a>}
                    {row.phone && <span>📞 {row.phone}</span>}
                  </div>
                  {row.message && <p className="text-xs text-tv-green-deep/50 italic mt-1">"{row.message}"</p>}
                  {row.ospiti?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.ospiti.map((g, i) => (
                        <span key={i} className="text-[10px] bg-tv-cream px-2 py-0.5 rounded-full text-tv-green-deep/70 border border-tv-green-deep/10">
                          {g.nome} {g.cognome}{g.email ? ` · ${g.email}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {!row.confirmed && (
                    <button
                      onClick={() => onConfirm(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-orange text-tv-green-deep font-bold text-xs hover:bg-tv-orange/80 transition-colors"
                    >
                      <UserCheck size={13} /> Conferma
                    </button>
                  )}
                  {row.metodo_pagamento && !row.payment_completed && (
                    <button
                      onClick={() => onTogglePayment(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-green/20 text-tv-green-deep font-bold text-xs hover:bg-tv-green/40 transition-colors"
                      title="Segna come pagato"
                    >
                      💸 Pagato
                    </button>
                  )}
                  {row.metodo_pagamento && row.payment_completed && (
                    <button
                      onClick={() => onTogglePayment(row)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-tv-green-deep/10 text-tv-green-deep/60 font-bold text-xs hover:bg-tv-bordeaux/10 hover:text-tv-bordeaux transition-colors"
                      title="Segna come da ricevere"
                    >
                      ↩ Da ricevere
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(row.id)}
                    className="p-2.5 rounded-full bg-tv-bordeaux/10 text-tv-bordeaux hover:bg-tv-bordeaux hover:text-tv-cream transition-colors"
                    aria-label="Elimina"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          }
        </div>
        );
      })}
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

const MembersManager = ({ members, onCreate, onEdit, onDelete }) => {
  const fmtDay = (d) => {
    try { return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const founders = members
    .filter(m => !m.tessera_number)
    .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "it"));
  const numbered = members
    .filter(m => m.tessera_number)
    .sort((a, b) => parseInt(a.tessera_number) - parseInt(b.tessera_number));
  const sorted = [...numbered, ...founders];

  const tessereNumeri = numbered.map(m => parseInt(m.tessera_number)).filter(n => !isNaN(n));
  const maxTessera = tessereNumeri.length > 0 ? Math.max(...tessereNumeri) : 0;
  const tessereSet = new Set(tessereNumeri);
  const lacune = [];
  for (let i = 1; i <= maxTessera; i++) {
    if (!tessereSet.has(i)) lacune.push(i);
  }
  const prossimaLibera = maxTessera + 1;

  return (
    <div data-testid="admin-members-manager">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <button onClick={onCreate} className="btn-tv inline-flex items-center gap-2 px-5 py-3 rounded-full bg-tv-green-deep text-tv-cream font-bold">
          <Plus size={18} /> Aggiungi socio
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-tv-green/20 text-tv-green-deep font-bold text-xs">
            <Users size={13} /> {numbered.length} soci
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
            ⭐ {founders.length} fondatori
          </span>
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
