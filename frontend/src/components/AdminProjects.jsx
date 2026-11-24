import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Loader2, FolderKanban, Plus, ArrowUp, ArrowDown, Trash2, ArrowLeft, ImagePlus, X, ExternalLink, Pencil, Save,
} from "lucide-react";
import { PROJECT_ICONS, PROJECT_COLORS } from "./Progetti";
import { shrinkImage } from "../lib/imageTools";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const input = "w-full px-4 py-3 rounded-2xl bg-white border border-tv-green-deep/15 text-tv-green-deep outline-none focus:border-tv-green-deep/50";
const label = "block text-xs font-bold uppercase tracking-wider text-tv-green-deep/70 mb-1";
const card = "bg-white rounded-2xl border border-tv-green-deep/10 p-5 md:p-6";

const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`);

const EMPTY_TOPIC = () => ({ id: newId(), title: "", text: "", image_url: "", image_alt: "", link_url: "", link_label: "" });
const EMPTY_PROJECT = {
  title: "", tag: "", summary: "", icon: "sparkles", color: "green", cover_url: "",
  intro_title: "", intro_text: "", event_categories: [], topics: [], published: true,
};

const errorText = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return "Controlla i campi: i link devono iniziare con https:// e alcuni testi sono troppo lunghi.";
  return fallback;
};

/** Scelta di una foto: carica dal computer (caricata su Cloudinary) oppure incolla un indirizzo. */
const ImagePicker = ({ token, value, onChange, hint }) => {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await shrinkImage(file);
      const { data } = await axios.post(`${API}/admin/projects/upload-image`, { image_data: dataUrl },
        { headers: { Authorization: `Bearer ${token}` } });
      onChange(data.url);
    } catch (err) {
      toast.error(errorText(err, err.message || "Foto non caricata"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Anteprima" className="h-36 w-auto max-w-full rounded-2xl object-cover border border-tv-green-deep/10" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Rimuovi la foto"
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-tv-bordeaux text-white shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="text-sm text-tv-green-deep/60 mb-2">{hint || "Nessuna foto"}</div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-tv-green-deep/20 text-sm font-bold text-tv-green-deep hover:bg-tv-green-deep/5 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {value ? "Sostituisci foto" : "Carica foto"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      </div>
      <details className="mt-2">
        <summary className="text-xs font-bold text-tv-green-deep/60 cursor-pointer">Oppure incolla l'indirizzo di una foto già online</summary>
        <input
          type="url"
          placeholder="https://…"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${input} mt-2`}
        />
      </details>
    </div>
  );
};

const Field = ({ id, title, children, hint }) => (
  <div>
    <label htmlFor={id} className={label}>{title}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-tv-green-deep/60">{hint}</p>}
  </div>
);

// ---------- Modifica di un progetto ----------
const ProjectEditor = ({ token, project, eventCategories, onBack, onSaved, onDeleted }) => {
  const isNew = !project;
  const [form, setForm] = useState(() => (project
    ? { ...EMPTY_PROJECT, ...project, cover_url: project.cover_url || "", topics: (project.topics || []).map((t) => ({ ...EMPTY_TOPIC(), ...t, image_url: t.image_url || "", link_url: t.link_url || "", link_label: t.link_label || "" })) }
    : { ...EMPTY_PROJECT }));
  const [saving, setSaving] = useState(false);
  const [photoInfo, setPhotoInfo] = useState(null); // foto degli eventi già collegate a questo progetto
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!project || !project.published) return;
    axios.get(`${API}/projects/${project.slug}/photos`, { params: { limit: 100, _t: Date.now() } })
      .then((r) => setPhotoInfo({ photos: r.data.length, events: new Set(r.data.map((p) => p.event_id)).size }))
      .catch(() => {});
  }, [project]);

  const setTopic = (id, patch) => setForm((f) => ({ ...f, topics: f.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const moveTopic = (i, d) => setForm((f) => {
    const j = i + d;
    if (j < 0 || j >= f.topics.length) return f;
    const topics = [...f.topics];
    [topics[i], topics[j]] = [topics[j], topics[i]];
    return { ...f, topics };
  });
  const removeTopic = (id) => {
    if (!window.confirm("Eliminare questo argomento?")) return;
    setForm((f) => ({ ...f, topics: f.topics.filter((t) => t.id !== id) }));
  };
  const toggleCategory = (c) => setForm((f) => ({
    ...f,
    event_categories: f.event_categories.includes(c) ? f.event_categories.filter((x) => x !== c) : [...f.event_categories, c],
  }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Il titolo è obbligatorio."); return; }
    const topics = form.topics
      .filter((t) => t.title.trim() || t.text.trim() || t.image_url)
      .map((t) => ({
        id: t.id, title: t.title.trim(), text: t.text.trim(), image_url: t.image_url.trim() || null,
        image_alt: (t.image_alt || "").trim(), link_url: t.link_url.trim() || null, link_label: (t.link_label || "").trim() || null,
      }));
    const payload = {
      title: form.title.trim(), tag: form.tag.trim(), summary: form.summary.trim(), icon: form.icon, color: form.color,
      cover_url: (form.cover_url || "").trim() || null, intro_title: form.intro_title.trim(), intro_text: form.intro_text.trim(),
      event_categories: form.event_categories, topics, published: form.published,
    };
    setSaving(true);
    try {
      if (isNew) await axios.post(`${API}/admin/projects`, payload, auth);
      else await axios.put(`${API}/admin/projects/${project.id}`, payload, auth);
      toast.success("Progetto salvato.");
      onSaved();
    } catch (err) {
      toast.error(errorText(err, "Salvataggio non riuscito."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Eliminare il progetto «${project.title}» con tutti i suoi argomenti? L'operazione non si può annullare.`)) return;
    try {
      await axios.delete(`${API}/admin/projects/${project.id}`, auth);
      toast.success("Progetto eliminato.");
      onDeleted();
    } catch (err) {
      toast.error(errorText(err, "Eliminazione non riuscita."));
    }
  };

  return (
    <form onSubmit={save} className="space-y-6" data-testid="admin-project-editor">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-tv-green-deep/70 hover:text-tv-green-deep">
          <ArrowLeft size={16} /> Tutti i progetti
        </button>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a href={`/progetti/${project.slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-tv-green-deep/20 text-sm font-bold text-tv-green-deep hover:bg-tv-green-deep/5">
              <ExternalLink size={14} /> Vedi sul sito
            </a>
          )}
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green-deep/85 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salva
          </button>
        </div>
      </div>

      {/* 1. Scheda */}
      <section className={card}>
        <h3 className="font-display font-black text-lg text-tv-green-deep mb-1">1. La scheda del progetto</h3>
        <p className="text-sm text-tv-green-deep/60 mb-4">È il riquadro colorato che si vede nell'elenco dei progetti e in cima alla pagina.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field id="p-title" title="Titolo *"><input id="p-title" className={input} value={form.title} onChange={set("title")} maxLength={100} required /></Field>
          <Field id="p-tag" title="Etichetta breve" hint="Piccola scritta sopra il titolo, per esempio «Fili di benessere»."><input id="p-tag" className={input} value={form.tag} onChange={set("tag")} maxLength={60} /></Field>
          <div className="md:col-span-2">
            <Field id="p-summary" title="Descrizione breve" hint="Due righe che compaiono nella scheda."><textarea id="p-summary" className={input} rows={3} value={form.summary} onChange={set("summary")} maxLength={400} /></Field>
          </div>
          <div>
            <span className={label}>Colore</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colore della scheda">
              {Object.entries(PROJECT_COLORS).map(([key, c]) => (
                <button key={key} type="button" role="radio" aria-checked={form.color === key}
                  onClick={() => setForm((f) => ({ ...f, color: key }))}
                  className={`px-4 py-2 rounded-full text-sm font-bold ${c.bg} ${c.text} ${form.color === key ? "ring-2 ring-offset-2 ring-tv-green-deep" : "opacity-70 hover:opacity-100"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Icona</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Icona della scheda">
              {Object.entries(PROJECT_ICONS).map(([key, { label: l, Icon }]) => (
                <button key={key} type="button" role="radio" aria-checked={form.icon === key} aria-label={l} title={l}
                  onClick={() => setForm((f) => ({ ...f, icon: key }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${form.icon === key ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "bg-white text-tv-green-deep border-tv-green-deep/15 hover:bg-tv-green-deep/5"}`}>
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <span className={label}>Foto di copertina (facoltativa)</span>
            <ImagePicker token={token} value={form.cover_url} onChange={(u) => setForm((f) => ({ ...f, cover_url: u }))} hint="Nessuna foto: la scheda resta colorata." />
          </div>
          <label className="md:col-span-2 inline-flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="w-5 h-5" />
            <span className="text-sm font-bold text-tv-green-deep">Visibile sul sito</span>
            <span className="text-xs text-tv-green-deep/60">Se tolta la spunta, il progetto resta qui come bozza e non compare nel sito.</span>
          </label>
        </div>
      </section>

      {/* 2. Pagina */}
      <section className={card}>
        <h3 className="font-display font-black text-lg text-tv-green-deep mb-1">2. La pagina del progetto</h3>
        <p className="text-sm text-tv-green-deep/60 mb-4">Si apre quando qualcuno clicca sulla scheda.</p>
        <div className="space-y-4">
          <Field id="p-intro-title" title="Titolo dell'introduzione"><input id="p-intro-title" className={input} value={form.intro_title} onChange={set("intro_title")} maxLength={150} placeholder="Per esempio: Pensiamo che la salute sia importante" /></Field>
          <Field id="p-intro-text" title="Testo dell'introduzione" hint="Lascia una riga vuota per andare a capo con un nuovo paragrafo."><textarea id="p-intro-text" className={input} rows={8} value={form.intro_text} onChange={set("intro_text")} maxLength={8000} /></Field>
          <div>
            <span className={label}>Eventi collegati</span>
            <p className="text-xs text-tv-green-deep/60 mb-2">
              Nella pagina compaiono in automatico i prossimi eventi di queste categorie e le foto di copertina degli eventi passati.
              Se vuoi aggiungere altre foto di un evento, apri l'evento nella scheda <strong>Eventi</strong> e usa «Foto dell'evento».
              {photoInfo && (
                <> Ora ci sono <strong>{photoInfo.photos} foto</strong> da <strong>{photoInfo.events} eventi</strong>.</>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {eventCategories.map((c) => (
                <label key={c} className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-bold cursor-pointer ${form.event_categories.includes(c) ? "bg-tv-green-deep text-tv-cream border-tv-green-deep" : "bg-white text-tv-green-deep border-tv-green-deep/15"}`}>
                  <input type="checkbox" className="sr-only" checked={form.event_categories.includes(c)} onChange={() => toggleCategory(c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Argomenti */}
      <section className={card}>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="font-display font-black text-lg text-tv-green-deep">3. Argomenti</h3>
            <p className="text-sm text-tv-green-deep/60">Ogni argomento ha titolo, testo, foto e un link: per raccontare cosa abbiamo fatto o cosa promuoviamo.</p>
          </div>
          <button type="button" onClick={() => setForm((f) => ({ ...f, topics: [...f.topics, EMPTY_TOPIC()] }))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green-deep/85">
            <Plus size={14} /> Aggiungi argomento
          </button>
        </div>
        {form.topics.length === 0 && <p className="text-sm text-tv-green-deep/60">Nessun argomento: la pagina mostra solo l'introduzione e gli eventi.</p>}
        <div className="space-y-4">
          {form.topics.map((t, i) => (
            <div key={t.id} className="rounded-2xl border border-tv-green-deep/15 bg-tv-cream/50 p-4 md:p-5" data-testid={`admin-topic-${i}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-tv-green-deep/60">Argomento {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveTopic(i, -1)} disabled={i === 0} aria-label="Sposta su" className="p-2 rounded-full hover:bg-tv-green-deep/10 disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => moveTopic(i, 1)} disabled={i === form.topics.length - 1} aria-label="Sposta giù" className="p-2 rounded-full hover:bg-tv-green-deep/10 disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => removeTopic(t.id)} aria-label="Elimina argomento" className="p-2 rounded-full text-tv-bordeaux hover:bg-tv-bordeaux/10"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Field id={`t-title-${t.id}`} title="Titolo"><input id={`t-title-${t.id}`} className={input} value={t.title} onChange={(e) => setTopic(t.id, { title: e.target.value })} maxLength={120} /></Field></div>
                <div className="md:col-span-2"><Field id={`t-text-${t.id}`} title="Testo" hint="Riga vuota = nuovo paragrafo."><textarea id={`t-text-${t.id}`} className={input} rows={5} value={t.text} onChange={(e) => setTopic(t.id, { text: e.target.value })} maxLength={4000} /></Field></div>
                <div className="md:col-span-2">
                  <span className={label}>Foto</span>
                  <ImagePicker token={token} value={t.image_url} onChange={(u) => setTopic(t.id, { image_url: u })} />
                </div>
                {t.image_url && (
                  <div className="md:col-span-2"><Field id={`t-alt-${t.id}`} title="Descrizione della foto" hint="Una frase che dice cosa si vede: serve a chi non vede lo schermo."><input id={`t-alt-${t.id}`} className={input} value={t.image_alt || ""} onChange={(e) => setTopic(t.id, { image_alt: e.target.value })} maxLength={200} /></Field></div>
                )}
                <Field id={`t-link-${t.id}`} title="Link (facoltativo)"><input id={`t-link-${t.id}`} type="url" className={input} placeholder="https://…" value={t.link_url} onChange={(e) => setTopic(t.id, { link_url: e.target.value })} maxLength={600} /></Field>
                <Field id={`t-linklabel-${t.id}`} title="Scritta del pulsante"><input id={`t-linklabel-${t.id}`} className={input} placeholder="Scopri di più" value={t.link_label} onChange={(e) => setTopic(t.id, { link_label: e.target.value })} maxLength={60} /></Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between flex-wrap gap-3">
        {!isNew ? (
          <button type="button" onClick={remove} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-tv-bordeaux border border-tv-bordeaux/30 hover:bg-tv-bordeaux/10">
            <Trash2 size={14} /> Elimina progetto
          </button>
        ) : <span />}
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green-deep/85 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salva il progetto
        </button>
      </div>
    </form>
  );
};

/** Scheda admin "Progetti": elenco, ordine, modifica di schede, introduzioni e argomenti. */
export const ProjectsManager = ({ token, eventCategories = [] }) => {
  const [projects, setProjects] = useState(null);
  const [editing, setEditing] = useState(null); // null = elenco, "new" = nuovo, altrimenti il progetto
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/projects`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(data);
    } catch (e) {
      toast.error(errorText(e, "Impossibile caricare i progetti"));
      setProjects([]);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const move = async (i, d) => {
    const j = i + d;
    if (j < 0 || j >= projects.length) return;
    const next = [...projects];
    [next[i], next[j]] = [next[j], next[i]];
    setProjects(next);
    try {
      await axios.post(`${API}/admin/projects/reorder`, { ids: next.map((p) => p.id) }, auth);
    } catch (e) {
      toast.error("Ordine non salvato.");
      load();
    }
  };

  if (projects === null) {
    return <div className="text-tv-green-deep/60 flex items-center gap-2 font-bold"><Loader2 className="animate-spin" size={18} /> Caricamento…</div>;
  }

  if (editing) {
    return (
      <ProjectEditor
        token={token}
        project={editing === "new" ? null : editing}
        eventCategories={eventCategories}
        onBack={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
        onDeleted={() => { setEditing(null); load(); }}
      />
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-projects">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-tv-orange/20 text-tv-orange flex items-center justify-center"><FolderKanban size={22} /></div>
          <div>
            <h2 className="font-display font-black text-2xl text-tv-green-deep">Progetti</h2>
            <p className="text-sm text-tv-green-deep/70">Le schede della pagina «Progetti» del sito e le pagine che si aprono al clic.</p>
          </div>
        </div>
        <button type="button" onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green-deep/85">
          <Plus size={14} /> Nuovo progetto
        </button>
      </div>

      {projects.length === 0 && <div className={`${card} text-tv-green-deep/70`}>Nessun progetto. Premi «Nuovo progetto» per crearne uno.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p, i) => {
          const c = PROJECT_COLORS[p.color] || PROJECT_COLORS.green;
          const Icon = (PROJECT_ICONS[p.icon] || PROJECT_ICONS.sparkles).Icon;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-tv-green-deep/10 overflow-hidden flex flex-col" data-testid={`admin-project-${p.slug}`}>
              <div className={`${c.bg} ${c.text} p-4 flex items-center gap-3`}>
                {p.cover_url
                  ? <img src={p.cover_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  : <span className={`w-14 h-14 rounded-xl ${c.chip} flex items-center justify-center`}><Icon size={26} /></span>}
                <div className="min-w-0">
                  <div className="font-display font-black text-lg leading-tight truncate">{p.title}</div>
                  <div className="text-xs font-bold uppercase tracking-wider truncate">{p.tag}</div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs text-tv-green-deep/70 space-x-3">
                  <span className={`font-bold ${p.published ? "text-tv-green-deep" : "text-tv-bordeaux"}`}>{p.published ? "Visibile" : "Bozza (non visibile)"}</span>
                  <span>{(p.topics || []).length} argomenti</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Sposta «${p.title}» prima`} className="p-2 rounded-full hover:bg-tv-green-deep/10 disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === projects.length - 1} aria-label={`Sposta «${p.title}» dopo`} className="p-2 rounded-full hover:bg-tv-green-deep/10 disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => setEditing(p)}
                    className="ml-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tv-green-deep text-tv-cream text-sm font-bold hover:bg-tv-green-deep/85">
                    <Pencil size={13} /> Modifica
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectsManager;
