/* ============================================================
   ÉCRAN — Accueil
   ============================================================ */
import { useNana, todayISO } from "../lib/store.jsx";
import { Icon, Avatar, CoupleAvatars, CoupleGlyph } from "../components/ui";

function fmtDateLong(d = new Date()) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function nextEvent(agenda) {
  const now = new Date();
  const up = agenda
    .map((e) => ({ ...e, dt: new Date(e.date + "T" + (e.start || "00:00")) }))
    .filter((e) => e.dt >= new Date(now.toDateString()))
    .sort((a, b) => a.dt - b.dt);
  return up[0] || null;
}

function Tile({ tone, emoji, name, sub, onClick, tilt }) {
  return (
    <button className={`card ${tilt}`} onClick={onClick}
      style={{ padding: 16, textAlign: "left", cursor: "pointer", background: "var(--card)",
        display: "flex", flexDirection: "column", gap: 10, minHeight: 116 }}>
      <span className="sticker" style={{ background: `var(--${tone}-soft)`, borderColor: `var(--${tone})` }}>{emoji}</span>
      <div>
        <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 16 }}>{name}</div>
        <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

function HomeHero() {
  const { couple } = useNana();
  return (
    <div className="row between" style={{ alignItems: "center", marginBottom: 22, gap: 14 }}>
      <div className="row grow" style={{ gap: 14, minWidth: 0 }}>
        <CoupleGlyph size={66} />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="kicker" style={{ textTransform: "uppercase" }}>{fmtDateLong()}</div>
          <div className="h-hand" style={{ fontSize: 33, lineHeight: 1.18, color: "var(--ink)", margin: "3px 0 5px" }}>Bonjour les amoureux</div>
          <div className="muted" style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13 }}>
            {couple.nickname ? couple.nickname : <>{couple.him.name} &amp; {couple.her.name}</>}
          </div>
        </div>
      </div>
      <div className="desktop-only" style={{ flex: "none" }}><CoupleAvatars size={42} /></div>
    </div>
  );
}

function DefiCard({ go }) {
  const { defi } = useNana();
  const today = defi.today;
  return (
    <button onClick={() => go("defi")} className="card tilt-l"
      style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "20px 22px", overflow: "hidden",
        background: "linear-gradient(135deg, var(--yellow-soft), var(--card))" }}>
      <span className="tape" />
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="grow" style={{ paddingRight: 12 }}>
          <div className="kicker" style={{ color: "var(--him)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="target" width="15" height="15" /> Défi du jour
          </div>
          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 21, marginTop: 8, lineHeight: 1.2 }}>
            {today.text} <span>{today.emoji}</span>
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            {today.done ? "✅ Relevé ensemble !" : "Tapez pour relever le défi à deux"}
          </div>
        </div>
        <span className="btn btn--him btn--fab" style={{ flex: "none" }}><Icon name="chevR" /></span>
      </div>
    </button>
  );
}

function BudgetMini({ go }) {
  const { budget } = useNana();
  const left = budget.total - budget.spent;
  const pct = budget.total > 0 ? Math.min(100, Math.round((budget.spent / budget.total) * 100)) : 0;
  return (
    <button onClick={() => go("budget")} className="card"
      style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: 18 }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 10 }}>
          <span className="sticker" style={{ width: 38, height: 38, fontSize: 17, background: "var(--her-soft)", borderColor: "var(--her)" }}>💰</span>
          <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 16 }}>Budget commun</div>
        </div>
        <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "var(--him)" }}>Reste {left}€</div>
      </div>
      <div className="track"><i style={{ width: pct + "%" }} /></div>
      <div className="muted" style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{budget.spent}€ dépensés sur {budget.total}€ ce mois-ci</div>
    </button>
  );
}

function TodayAgenda({ go }) {
  const { agenda } = useNana();
  const today = todayISO();
  const list = agenda.filter((e) => e.date === today).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="h2">Aujourd'hui</div>
        <button className="chip" onClick={() => go("agenda")}>Voir l'agenda</button>
      </div>
      {list.length === 0 ? (
        <div className="muted" style={{ fontWeight: 600, fontSize: 14, padding: "8px 2px" }}>Rien de prévu — journée tranquille à deux 🛋️</div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {list.map((e) => (
            <div key={e.id} className="row" style={{ gap: 12 }}>
              <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: `var(--${e.by})` }} />
              <div className="grow">
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14.5 }}>{e.title}</div>
                <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{e.start}–{e.end}</div>
              </div>
              <Avatar who={e.by} size={28} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Accueil({ go }) {
  const { courses, agenda, poesie, idees, messages } = useNana();
  const toBuy = courses.filter((c) => !c.done).length;
  const nx = nextEvent(agenda);
  const nxLabel = nx ? nx.title.replace(/\s?[\p{Emoji}]/gu, "").trim() : "Rien de prévu";

  const tiles = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Tile tone="her" emoji="🛒" name="Courses" sub={toBuy ? `${toBuy} à acheter` : "Liste vide"} onClick={() => go("courses")} tilt="tilt-l" />
      <Tile tone="him" emoji="📅" name="Agenda" sub={nx ? nxLabel : "Libre"} onClick={() => go("agenda")} tilt="tilt-r" />
      <Tile tone="plum" emoji="🪶" name="Poésie" sub={`${poesie.length} petits mots`} onClick={() => go("poesie")} tilt="tilt-r" />
      <Tile tone="yellow" emoji="💡" name="Idées Dates" sub={`${idees.length} idée${idees.length > 1 ? "s" : ""}`} onClick={() => go("idees")} tilt="tilt-l" />
      <div style={{ gridColumn: "1 / -1" }}>
        <Tile tone="leaf" emoji="💬" name="Nous" sub={`${messages.length} message${messages.length > 1 ? "s" : ""} · votre fil à deux`} onClick={() => go("messages")} tilt="" />
      </div>
    </div>
  );

  return (
    <div className="anim-pop">
      <HomeHero />
      {/* Desktop dashboard */}
      <div className="dgrid dgrid--home desktop-only">
        <div className="stack" style={{ gap: 18 }}>
          <DefiCard go={go} />
          {tiles}
        </div>
        <div className="stack" style={{ gap: 18 }}>
          <BudgetMini go={go} />
          <TodayAgenda go={go} />
        </div>
      </div>
      {/* Mobile stack */}
      <div className="stack mobile-only" style={{ gap: 18 }}>
        <DefiCard go={go} />
        {tiles}
        <TodayAgenda go={go} />
        <BudgetMini go={go} />
      </div>
    </div>
  );
}
