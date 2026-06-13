/* ============================================================
   NANAMOUREUX — Coque responsive (sidebar / bottom-nav)
   ============================================================ */
import { useEffect, useRef } from "react";
import { useNana } from "../lib/store.jsx";
import { Icon, CoupleGlyph } from "./ui";

export const NAV = [
  { id: "accueil",  label: "Accueil",     icon: "home" },
  { id: "defi",     label: "Défi du jour", icon: "target" },
  { id: "courses",  label: "Courses",     icon: "cart" },
  { id: "agenda",   label: "Agenda",      icon: "calendar" },
  { id: "poesie",   label: "Poésie",      icon: "feather" },
  { id: "idees",    label: "Idées Dates", icon: "bulb" },
  { id: "budget",   label: "Budget",      icon: "wallet" },
  { id: "messages", label: "Nous",        icon: "chat" },
];
const MOBILE_NAV = ["accueil", "courses", "agenda", "idees", "reglages"];

export function ThemeToggle() {
  const { theme, setTheme } = useNana();
  const dark = theme === "dark";
  const toggle = () => setTheme(dark ? "light" : "dark");
  return (
    <button className="iconbtn" onClick={toggle} aria-label="Thème" title={dark ? "Mode clair" : "Mode sombre"}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

export function PersonaSwitch({ compact }) {
  const { me, setMe, couple } = useNana();
  return (
    <div className="segment" style={compact ? { padding: 3 } : null}>
      <button className={me === "him" ? "on" : ""} onClick={() => setMe("him")}>{couple.him.emoji} {couple.him.name}</button>
      <button className={me === "her" ? "on" : ""} onClick={() => setMe("her")}>{couple.her.emoji} {couple.her.name}</button>
    </div>
  );
}

function Sidebar({ route, go }) {
  const { couple, courses } = useNana();
  const toBuy = courses.filter((c) => !c.done).length;
  const badges = { courses: toBuy || null };
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <CoupleGlyph size={48} />
        <div className="name">Nanamoureux
          <small>{couple.nickname ? couple.nickname : `${couple.him.name} · ${couple.her.name}`}</small>
        </div>
      </div>
      <div className="col" style={{ gap: 4, flex: 1 }}>
        {NAV.map((n) => (
          <button key={n.id} className={`sidelink ${route === n.id ? "on" : ""}`} onClick={() => go(n.id)}>
            <Icon name={n.icon} fill={route === n.id} />
            {n.label}
            {badges[n.id] && <span className="badge">{badges[n.id]}</span>}
          </button>
        ))}
      </div>
      <div className="col" style={{ gap: 10, paddingTop: 12, borderTop: "1.5px solid var(--line)" }}>
        <button className={`sidelink ${route === "reglages" ? "on" : ""}`} onClick={() => go("reglages")}>
          <Icon name="gear" fill={route === "reglages"} /> Réglages
        </button>
        <div className="row between" style={{ padding: "0 6px" }}>
          <PersonaSwitch compact />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

function BottomNav({ route, go }) {
  const labels = { accueil: "Accueil", courses: "Courses", agenda: "Agenda", idees: "Idées", reglages: "Réglages" };
  const icons = { accueil: "home", courses: "cart", agenda: "calendar", idees: "bulb", reglages: "gear" };
  return (
    <nav className="bottomnav">
      {MOBILE_NAV.map((id) => {
        const on = route === id;
        return (
          <button key={id} className={`navbtn ${on ? "on" : ""}`} onClick={() => go(id)}>
            <span className="navbtn__ic"><Icon name={icons[id]} fill={on} /></span>
            {labels[id]}
          </button>
        );
      })}
    </nav>
  );
}

export function Shell({ route, go, children }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [route]);
  return (
    <div className="app">
      <Sidebar route={route} go={go} />
      <div className="app__main">
        <div className="scroll" ref={scrollRef}>
          <div className="page">{children}</div>
        </div>
        <BottomNav route={route} go={go} />
      </div>
    </div>
  );
}
