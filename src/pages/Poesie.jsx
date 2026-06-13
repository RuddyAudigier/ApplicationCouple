/* ============================================================
   ÉCRAN — Poésie (petits mots)
   ============================================================ */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNana } from "../lib/store.jsx";
import { Icon, Avatar, PageHeader, FX } from "../components/ui";

const SCOPES = [
  { id: "shared", label: "Partagé", emoji: "💞" },
  { id: "love",   label: "À mon amour", emoji: "💌" },
  { id: "widget", label: "Widget", emoji: "📌" },
];
function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return Math.floor(diff / 60) + " min";
  if (diff < 86400) return Math.floor(diff / 3600) + " h";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Compose({ onClose, initialScope = "shared" }) {
  const { addNote } = useNana();
  const [scope, setScope] = useState(initialScope);
  const [text, setText] = useState("");
  const send = (el) => {
    if (!text.trim()) return;
    addNote({ text: text.trim(), scope: scope === "widget" ? "shared" : scope, widget: scope === "widget" });
    FX.burstFrom(el.currentTarget);
    setText(""); onClose();
  };
  return (
    <div className="card anim-pop" style={{ padding: 20, marginBottom: 20, background: "linear-gradient(135deg, var(--him-soft), var(--her-soft))" }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="h2"><Icon name="heart" width="18" height="18" style={{ verticalAlign: "-3px", marginRight: 6 }} />Écrire un petit mot</div>
        <button className="iconbtn" onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
        {SCOPES.map((s) => (
          <button key={s.id} className={`chip ${scope === s.id ? "on--him" : ""}`} onClick={() => setScope(s.id)}>{s.emoji} {s.label}</button>
        ))}
      </div>
      <textarea className="field" autoFocus placeholder="Une phrase, une pensée, un truc simple…" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 96, fontFamily: "var(--font-hand)", fontSize: 22 }} />
      <div className="row" style={{ gap: 10, marginTop: 14 }}>
        <button className="btn btn--him" onClick={send}><Icon name="send" width="17" height="17" /> Envoyer</button>
        <button className="btn btn--soft" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

function NoteCard({ note }) {
  const { couple, me, editNote, delNote, togglePin } = useNana();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(note.text);
  const mine = note.by === me;
  const save = () => { if (val.trim()) editNote(note.id, val.trim()); setEditing(false); };
  const scopeMeta = note.scope === "love" ? { label: "À mon amour", emoji: "💌" } : { label: "Partagé", emoji: "💞" };
  return (
    <div className="card" style={{ padding: 20, position: "relative",
      background: mine ? "var(--him-soft)" : "var(--her-soft)", borderColor: mine ? "var(--him)" : "var(--her)" }}>
      {note.widget && <span className="tape tape--him" style={{ left: "auto", right: 16, marginLeft: 0 }} />}
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="chip" style={{ pointerEvents: "none", fontSize: 12, padding: "5px 10px" }}>{scopeMeta.emoji} {scopeMeta.label}{note.widget ? " · 📌 widget" : ""}</div>
        <div className="row gap-sm">
          <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => togglePin(note)} title="Épingler au widget"><Icon name="pin" width="16" height="16" /></button>
          {mine && <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setEditing(true)}><Icon name="pencil" width="16" height="16" /></button>}
          {mine && <button className="iconbtn iconbtn--danger" style={{ width: 32, height: 32 }} onClick={() => delNote(note.id)}><Icon name="trash" width="16" height="16" /></button>}
        </div>
      </div>
      {editing ? (
        <textarea className="field" autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} style={{ fontFamily: "var(--font-hand)", fontSize: 24 }} />
      ) : (
        <div className="h-hand" style={{ fontSize: 28, lineHeight: 1.3, color: "var(--ink)", paddingBottom: 2 }}>{note.text}</div>
      )}
      <div className="row" style={{ gap: 8, marginTop: 18 }}>
        <Avatar who={note.by} size={24} />
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>{couple[note.by].name} · {timeAgo(note.at)}</div>
      </div>
    </div>
  );
}

export default function Poesie({ go }) {
  const { poesie } = useNana();
  const [searchParams, setSearchParams] = useSearchParams();
  const [writing, setWriting] = useState(() => searchParams.get("compose") === "1");
  const initialScope = searchParams.get("mode") === "to_partner" ? "love" : "shared";
  const widgetNote = poesie.find((n) => n.widget);

  const closeWriting = () => {
    setWriting(false);
    if (searchParams.has("compose") || searchParams.has("mode")) setSearchParams({}, { replace: true });
  };
  return (
    <div className="anim-pop" style={{ position: "relative" }}>
      <PageHeader title="Poésie" emoji="🪶" sub="Un endroit doux pour se dire les choses" onBack={() => go("accueil")}
        right={!writing && <button className="btn btn--him btn--sm" onClick={() => setWriting(true)}><Icon name="plus" width="16" height="16" /> Écrire</button>} />

      {widgetNote && (
        <div className="card card--dash tilt-r" style={{ padding: 18, marginBottom: 18, background: "var(--yellow-soft)", textAlign: "center" }}>
          <div className="kicker" style={{ marginBottom: 6 }}>📌 Sur votre widget</div>
          <div className="h-hand" style={{ fontSize: 28 }}>{widgetNote.text}</div>
        </div>
      )}

      {writing && <Compose onClose={closeWriting} initialScope={initialScope} />}

      {poesie.length === 0 ? (
        <div className="card card--dash" style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 34 }}>🪶</div>
          <div className="muted" style={{ fontWeight: 700, marginTop: 8 }}>Aucun petit mot… encore. Lancez-vous !</div>
        </div>
      ) : (
        <div className="dgrid dgrid--2 enter">
          {poesie.map((n) => <NoteCard key={n.id} note={n} />)}
        </div>
      )}
    </div>
  );
}
