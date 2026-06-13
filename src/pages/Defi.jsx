/* ============================================================
   ÉCRAN — Défi du jour
   ============================================================ */
import { useState, useRef } from "react";
import { useNana } from "../lib/store.jsx";
import { Icon, Avatar, PageHeader, FX } from "../components/ui";
import { DEFI_SUGGESTIONS } from "../lib/themes";

function PersonaDefiCol({ who }) {
  const { couple, defi, addDefiItem, toggleDefiItem, delDefiItem } = useNana();
  const list = defi.list[who];
  const [text, setText] = useState("");
  const add = () => {
    if (!text.trim()) return;
    addDefiItem(who, text.trim());
    setText("");
  };
  const toggle = (it, el) => {
    if (!it.done && el) FX.burstFrom(el);
    toggleDefiItem(it);
  };
  return (
    <div className="card" style={{ padding: 18, borderColor: `var(--${who})` }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <Avatar who={who} size={34} />
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>Défis de {couple[who].name}</div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Petits gestes perso</div>
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <input className="field" placeholder="Ajouter un petit défi…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} style={{ padding: "9px 12px" }} />
        <button className={`btn btn--${who} btn--sm`} onClick={add}><Icon name="plus" width="16" height="16" /></button>
      </div>
      {list.length === 0 ? (
        <div className="muted" style={{ fontWeight: 600, fontSize: 13.5, padding: "6px 2px" }}>Aucun défi pour le moment.</div>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {list.map((it) => (
            <div key={it.id} className="row" style={{ gap: 10, opacity: it.done ? 0.6 : 1 }}>
              <input type="checkbox" className="check" checked={it.done} onChange={(e) => toggle(it, e.currentTarget)} style={{ width: 22, height: 22 }} />
              <div className="grow" style={{ fontWeight: 700, fontFamily: "var(--font-ui)", fontSize: 14, textDecoration: it.done ? "line-through" : "none" }}>{it.text}</div>
              <button className="iconbtn iconbtn--danger" style={{ width: 30, height: 30 }} onClick={() => delDefiItem(it.id)}><Icon name="trash" width="15" height="15" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Defi({ go }) {
  const { defi, toggleDefiToday, setDefiToday } = useNana();
  const today = defi.today;
  const [tab, setTab] = useState("today");
  const releverRef = useRef(null);
  const relever = (el) => {
    if (!today.done && el) FX.burstFrom(el);
    toggleDefiToday();
  };
  const shuffle = () => {
    const s = DEFI_SUGGESTIONS[(Math.random() * DEFI_SUGGESTIONS.length) | 0];
    setDefiToday(s);
  };
  return (
    <div className="anim-pop">
      <PageHeader title="Défi du jour" emoji="🎯" sub={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} onBack={() => go("accueil")}
        right={<div className="segment"><button className={tab === "today" ? "on" : ""} onClick={() => setTab("today")}>Aujourd'hui</button><button className={tab === "week" ? "on" : ""} onClick={() => setTab("week")}>Semaine</button></div>} />

      {tab === "today" ? (
        <>
          <div className="card tilt-l" style={{ padding: 26, marginBottom: 20, overflow: "hidden", textAlign: "center",
            background: "linear-gradient(135deg, var(--yellow-soft), var(--card))" }}>
            <span className="tape" />
            <div style={{ fontSize: 46 }}>{today.emoji}</div>
            <div className="h-hand" style={{ fontSize: 38, marginTop: 6 }}>{today.text}</div>
            <div className="row" style={{ gap: 10, justifyContent: "center", marginTop: 18 }}>
              <button ref={releverRef} className={today.done ? "btn btn--soft" : "btn btn--him"} onClick={(e) => relever(e.currentTarget)}>
                {today.done ? "✅ Relevé ensemble !" : "💪 On le relève !"}
              </button>
              <button className="btn btn--soft" onClick={shuffle}><Icon name="sparkle" width="17" height="17" /> Autre défi</button>
            </div>
          </div>
          <div className="dgrid dgrid--2">
            <PersonaDefiCol who="him" />
            <PersonaDefiCol who="her" />
          </div>
        </>
      ) : (
        <div className="stack enter" style={{ gap: 12 }}>
          {DEFI_SUGGESTIONS.map((s, i) => (
            <div key={i} className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <span className="sticker" style={{ width: 44, height: 44, fontSize: 20 }}>{s.emoji}</span>
              <div className="grow" style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15.5 }}>{s.text}</div>
              <button className="chip on--yellow" onClick={() => { setDefiToday(s); setTab("today"); }}>Choisir</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
