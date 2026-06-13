/* ============================================================
   ÉCRAN — Idées Dates
   ============================================================ */
import { useState } from "react";
import { useNana } from "../lib/store.jsx";
import { Icon, PageHeader, FX } from "../components/ui";

const IDEA_CATS = [
  { id: "jazz",       emoji: "🎷", label: "Jazz" },
  { id: "romantique", emoji: "💘", label: "Romantique" },
  { id: "cozy",       emoji: "🕯️", label: "Cozy" },
  { id: "aventure",   emoji: "✨", label: "Aventure" },
  { id: "gourmand",   emoji: "🍽️", label: "Gourmand" },
];
const ideaCat = (id) => IDEA_CATS.find((c) => c.id === id) || IDEA_CATS[0];

function IdeaForm({ onClose }) {
  const { addIdea } = useNana();
  const [f, setF] = useState({ title: "", cat: "romantique", lieu: "", note: "" });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const add = (el) => {
    if (!f.title.trim()) return;
    addIdea({ ...f, title: f.title.trim() });
    FX.burstFrom(el.currentTarget);
    onClose();
  };
  return (
    <div className="card anim-pop" style={{ padding: 20, marginBottom: 20, background: "linear-gradient(135deg, var(--yellow-soft), var(--her-soft))" }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="h2">💡 Nouvelle idée</div>
        <button className="iconbtn" onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="stack" style={{ gap: 12 }}>
        <input className="field" autoFocus placeholder="Ex : Aller à un bar de jazz" value={f.title} onChange={(e) => set("title", e.target.value)} />
        <div className="row wrap" style={{ gap: 8 }}>
          {IDEA_CATS.map((c) => (
            <button key={c.id} className={`chip ${f.cat === c.id ? "on--yellow" : ""}`} onClick={() => set("cat", c.id)}>{c.emoji} {c.label}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 10, background: "var(--card-2)", borderRadius: "var(--r)", padding: "0 14px", border: "1.5px solid var(--line)" }}>
          <Icon name="pin" width="18" height="18" style={{ color: "var(--muted)", flex: "none" }} />
          <input className="field" placeholder="Lieu (optionnel)" value={f.lieu} onChange={(e) => set("lieu", e.target.value)} style={{ border: 0, background: "transparent", padding: "13px 0" }} />
        </div>
        <textarea className="field" placeholder="Petites notes (optionnel) : tenue, ambiance, budget, playlist…" value={f.note} onChange={(e) => set("note", e.target.value)} />
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn--him" onClick={add}><Icon name="plus" width="17" height="17" /> Ajouter l'idée</button>
          <button className="btn btn--soft" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function IdeaCard({ idea, highlight }) {
  const { delIdea, toggleIdea } = useNana();
  const c = ideaCat(idea.cat);
  const toggle = (el) => { if (!idea.done && el) FX.burstFrom(el); toggleIdea(idea); };
  return (
    <div className={`card ${highlight ? "anim-pop" : ""}`} style={{ padding: 0, overflow: "hidden",
      boxShadow: highlight ? "0 0 0 3px var(--yellow), var(--shadow-lg)" : "var(--shadow)", opacity: idea.done ? 0.7 : 1 }}>
      <div className="row between" style={{ padding: "14px 18px", background: "var(--card-2)", borderBottom: "1.5px solid var(--line)" }}>
        <div className="row" style={{ gap: 8, fontFamily: "var(--font-ui)", fontWeight: 700 }}><span style={{ fontSize: 18 }}>{c.emoji}</span> {c.label}</div>
        <div className="row gap-sm">
          <button className="iconbtn iconbtn--danger" style={{ width: 32, height: 32 }} onClick={() => delIdea(idea.id)}><Icon name="trash" width="16" height="16" /></button>
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <div className="h2" style={{ marginBottom: idea.lieu ? 6 : 8, textDecoration: idea.done ? "line-through" : "none" }}>{idea.title}</div>
        {idea.lieu && <div className="row" style={{ gap: 6, color: "var(--ink-soft)", fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}><Icon name="pin" width="15" height="15" /> {idea.lieu}</div>}
        {idea.note && <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-soft)" }}>{idea.note}</div>}
        <button className={idea.done ? "chip on--him" : "chip"} style={{ marginTop: 14 }} onClick={(e) => toggle(e.currentTarget)}>
          {idea.done ? "❤️ Fait ensemble !" : "Marquer comme fait"}
        </button>
      </div>
    </div>
  );
}

export default function Idees({ go }) {
  const { idees } = useNana();
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const [pick, setPick] = useState(null);

  const visible = filter === "all" ? idees : idees.filter((i) => i.cat === filter);
  const random = () => {
    const pool = idees.filter((i) => !i.done);
    if (!pool.length) return;
    const r = pool[(Math.random() * pool.length) | 0];
    setPick(r.id); setFilter("all");
    setTimeout(() => { const el = document.getElementById("idea-" + r.id); el && el.scrollIntoView && el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
  };

  return (
    <div className="anim-pop">
      <PageHeader title="Idées Dates" emoji="💡" sub={`${idees.length} idée${idees.length > 1 ? "s" : ""} à faire fondre le quotidien`} onBack={() => go("accueil")}
        right={!adding && <button className="btn btn--him btn--sm" onClick={() => setAdding(true)}><Icon name="plus" width="16" height="16" /> Ajouter</button>} />

      {adding && <IdeaForm onClose={() => setAdding(false)} />}

      <div className="row between wrap" style={{ gap: 10, marginBottom: 16 }}>
        <div className="row wrap hide-scroll" style={{ gap: 8, overflowX: "auto" }}>
          <button className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>Tout</button>
          {IDEA_CATS.map((c) => <button key={c.id} className={`chip ${filter === c.id ? "on" : ""}`} onClick={() => setFilter(c.id)}>{c.emoji} {c.label}</button>)}
        </div>
        <button className="btn btn--yellow btn--sm" onClick={random}>🎲 Tire au sort</button>
      </div>

      {visible.length === 0 ? (
        <div className="card card--dash" style={{ padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 34 }}>💡</div>
          <div className="muted" style={{ fontWeight: 700, marginTop: 8 }}>Aucune idée ici… inventez votre prochaine date !</div>
        </div>
      ) : (
        <div className="dgrid dgrid--2 enter">
          {visible.map((i) => <div id={"idea-" + i.id} key={i.id}><IdeaCard idea={i} highlight={pick === i.id} /></div>)}
        </div>
      )}
    </div>
  );
}
