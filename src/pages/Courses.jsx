/* ============================================================
   ÉCRAN — Courses
   ============================================================ */
import { useState, useRef } from "react";
import { useNana } from "../lib/store.jsx";
import { Icon, Avatar, PageHeader, FX } from "../components/ui";

const COURSE_CATS = [
  { id: "frais",    emoji: "🥬", label: "Frais",    tone: "leaf" },
  { id: "surgele",  emoji: "❄️", label: "Surgelé",  tone: "her" },
  { id: "plaisirs", emoji: "🍫", label: "Plaisirs", tone: "him" },
  { id: "boissons", emoji: "🥤", label: "Boissons", tone: "yellow" },
  { id: "maison",   emoji: "🧽", label: "Maison",   tone: "plum" },
  { id: "autres",   emoji: "🍲", label: "Autres",   tone: "muted" },
];
const catOf = (id) => COURSE_CATS.find((c) => c.id === id) || COURSE_CATS[5];

function CourseRow({ item, onToggle, onDel, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.text);
  const cat = catOf(item.cat);
  const save = () => { if (val.trim()) onEdit(item.id, val.trim()); setEditing(false); };
  return (
    <div className="card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
      opacity: item.done ? 0.62 : 1, borderRadius: 18 }}>
      <input type="checkbox" className="check" checked={item.done}
        onChange={(e) => onToggle(item, e.currentTarget)} />
      <span style={{ fontSize: 19, flex: "none" }}>{cat.emoji}</span>
      <div className="grow" style={{ minWidth: 0 }}>
        {editing ? (
          <input className="field" autoFocus value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()} onBlur={save} style={{ padding: "6px 10px" }} />
        ) : (
          <>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15,
              textDecoration: item.done ? "line-through" : "none", textDecorationColor: "var(--leaf)" }}>{item.text}</div>
            <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{cat.label}</div>
          </>
        )}
      </div>
      <Avatar who={item.by} size={26} />
      {!item.done && (
        <button className="iconbtn" onClick={() => setEditing(true)} aria-label="Modifier"><Icon name="pencil" /></button>
      )}
      <button className="iconbtn iconbtn--danger" onClick={() => onDel(item.id)} aria-label="Supprimer"><Icon name="trash" /></button>
    </div>
  );
}

export default function Courses({ go }) {
  const { courses, addCourse, toggleCourse, delCourse, editCourse } = useNana();
  const [text, setText] = useState("");
  const [cat, setCat] = useState("frais");
  const [filter, setFilter] = useState("all");
  const inputRef = useRef(null);

  const add = () => {
    if (!text.trim()) return;
    addCourse(text.trim(), cat);
    setText("");
    inputRef.current && inputRef.current.focus();
  };
  const toggle = (item, el) => {
    if (!item.done && el) FX.burstFrom(el);
    toggleCourse(item);
  };

  const visible = filter === "all" ? courses : courses.filter((c) => c.cat === filter);
  const toBuy = visible.filter((c) => !c.done);
  const done = visible.filter((c) => c.done);

  return (
    <div className="anim-pop">
      <PageHeader title="Nos courses" emoji="🛒" sub="La liste partagée, à jour pour vous deux" onBack={() => go("accueil")} />

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="row" style={{ gap: 10 }}>
          <input ref={inputRef} className="field" placeholder="Ajouter un truc…" value={text}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="btn btn--him btn--add" onClick={add} aria-label="Ajouter"><Icon name="plus" /></button>
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
          {COURSE_CATS.map((c) => (
            <button key={c.id} className={`chip ${cat === c.id ? "on--him" : ""}`} onClick={() => setCat(c.id)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row wrap hide-scroll" style={{ gap: 8, marginBottom: 16, overflowX: "auto" }}>
        <button className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>Tout</button>
        {COURSE_CATS.map((c) => (
          <button key={c.id} className={`chip ${filter === c.id ? "on" : ""}`} onClick={() => setFilter(c.id)}>{c.emoji} {c.label}</button>
        ))}
      </div>

      <div className="dgrid dgrid--2">
        <div>
          <div className="kicker" style={{ marginBottom: 10 }}>À acheter ({toBuy.length})</div>
          {toBuy.length === 0 ? (
            <div className="card card--dash" style={{ padding: 22, textAlign: "center" }}>
              <div style={{ fontSize: 30 }}>🛍️</div>
              <div className="muted" style={{ fontWeight: 700, marginTop: 6 }}>Tout est coché, bravo !</div>
            </div>
          ) : (
            <div className="stack enter" style={{ gap: 10 }}>
              {toBuy.map((it) => <CourseRow key={it.id} item={it} onToggle={toggle} onDel={delCourse} onEdit={editCourse} />)}
            </div>
          )}
        </div>
        {done.length > 0 && (
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Dans le panier ({done.length})</div>
            <div className="stack" style={{ gap: 10 }}>
              {done.map((it) => <CourseRow key={it.id} item={it} onToggle={toggle} onDel={delCourse} onEdit={editCourse} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
