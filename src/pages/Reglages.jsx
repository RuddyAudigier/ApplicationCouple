/* ============================================================
   ÉCRAN — Réglages
   ============================================================ */
import { useRef } from "react";
import { useNana } from "../lib/store.jsx";
import { Avatar, PageHeader } from "../components/ui";
import { ThemeToggle, PersonaSwitch } from "../components/Shell.jsx";
import { PERSON_COLORS, MASCOTS, BG_TINTS, prettyDuration } from "../lib/themes";

const EMO = {
  him: ["🐻", "🦁", "🐶", "🦊", "🐧", "🦝", "🐯", "👨", "🦔", "🐨"],
  her: ["🦊", "🐱", "🦋", "🌷", "🐰", "🦄", "🐥", "👩", "🐝", "🐬"],
};

function PersonEdit({ who }) {
  const { couple, updatePerson } = useNana();
  const p = couple[who];
  const inputRef = useRef(null);
  const saveName = () => {
    const v = (inputRef.current?.value || "").trim();
    if (v && v !== p.name) updatePerson(who, { name: v });
  };
  return (
    <div className="card" style={{ padding: 18, borderColor: `var(--${who})` }}>
      <div className="row" style={{ gap: 12, marginBottom: 14 }}>
        <Avatar who={who} size={46} />
        <div className="grow">
          <div className="kicker" style={{ marginBottom: 4 }}>{who === "him" ? "Profil 1" : "Profil 2"}</div>
          <input ref={inputRef} className="field" key={p.name} defaultValue={p.name} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && saveName()} style={{ padding: "9px 12px" }} />
        </div>
      </div>

      <div className="kicker" style={{ marginBottom: 8 }}>Avatar</div>
      <div className="row wrap" style={{ gap: 7, marginBottom: 16 }}>
        {EMO[who].map((e) => (
          <button key={e} className="chip" style={{ fontSize: 19, padding: "5px 9px", borderColor: p.emoji === e ? `var(--${who})` : "var(--line)", background: p.emoji === e ? `var(--${who}-soft)` : "var(--card)" }} onClick={() => updatePerson(who, { emoji: e })}>{e}</button>
        ))}
      </div>

      <div className="kicker" style={{ marginBottom: 8 }}>Couleur</div>
      <div className="row wrap" style={{ gap: 9 }}>
        {PERSON_COLORS.map((c) => {
          const on = (p.color || "").toLowerCase() === c.hex.toLowerCase();
          return (
            <button key={c.hex} onClick={() => updatePerson(who, { color: c.hex })} title={c.name} aria-label={c.name}
              style={{ width: 32, height: 32, borderRadius: "50%", background: c.hex, cursor: "pointer",
                border: on ? "3px solid var(--card)" : "2px solid var(--card)",
                boxShadow: on ? `0 0 0 2.5px ${c.hex}, var(--shadow-sm)` : "var(--shadow-sm)",
                transform: on ? "scale(1.12)" : "none", transition: "transform .16s" }} />
          );
        })}
      </div>
    </div>
  );
}

function NicknameCard() {
  const { couple, updateCoupleSettings } = useNana();
  const inputRef = useRef(null);
  const save = () => {
    const v = inputRef.current?.value || "";
    if (v !== (couple.nickname || "")) updateCoupleSettings({ nickname: v });
  };
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="row between" style={{ gap: 12, marginBottom: 4 }}>
        <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>Petit nom du couple 💞</div>
      </div>
      <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>S'affiche en haut de l'app. Laissez vide pour garder vos deux prénoms.</div>
      <input ref={inputRef} className="field" key={couple.nickname || ""} placeholder="ex : Les Loulous, Team Câlin…" defaultValue={couple.nickname || ""}
        onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} />
    </div>
  );
}

function MascotPicker() {
  const { couple, updateCoupleSettings } = useNana();
  const current = couple.mascot || "blobs";
  const him = couple.him.color;
  const her = couple.her.color;
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, marginBottom: 4 }}>Votre mascotte 🪄</div>
      <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>Le petit duo qui vous représente partout dans l'app.</div>
      <div className="row wrap" style={{ gap: 10 }}>
        {MASCOTS.map((m) => {
          const on = current === m.key;
          const preview = m.a ? (
            <div style={{ position: "relative", width: 46, height: 34, margin: "0 auto" }}>
              <span style={{ position: "absolute", left: 0, top: 4, fontSize: 20, transform: "rotate(-7deg)" }}>{m.a}</span>
              <span style={{ position: "absolute", left: 20, top: 4, fontSize: 20, transform: "rotate(7deg)" }}>{m.b}</span>
              <span style={{ position: "absolute", left: 19, top: -4, fontSize: 12 }}>💛</span>
            </div>
          ) : (
            <div style={{ position: "relative", width: 46, height: 34, margin: "0 auto" }}>
              <span style={{ position: "absolute", left: 2, top: 6, width: 22, height: 22, borderRadius: "50%", background: him, border: "2px solid var(--card)" }} />
              <span style={{ position: "absolute", left: 18, top: 6, width: 22, height: 22, borderRadius: "50%", background: her, border: "2px solid var(--card)" }} />
              <span style={{ position: "absolute", left: 17, top: -4, fontSize: 12 }}>💛</span>
            </div>
          );
          return (
            <button key={m.key} onClick={() => updateCoupleSettings({ mascot: m.key })} style={{ border: 0, background: "none", cursor: "pointer", width: 84 }}>
              <div style={{ padding: "10px 6px 8px", borderRadius: 16,
                border: on ? "2.5px solid var(--him)" : "2px solid var(--line)",
                background: on ? "var(--him-soft)" : "var(--card-2)",
                boxShadow: on ? "var(--shadow)" : "var(--shadow-sm)", transform: on ? "scale(1.04)" : "none", transition: "transform .16s" }}>
                {preview}
                <div className="muted" style={{ fontSize: 10.5, fontWeight: 700, marginTop: 6, lineHeight: 1.15, color: on ? "var(--him-ink)" : "var(--muted)" }}>{m.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BackgroundPicker() {
  const { theme, prefs, setPrefs } = useNana();
  const mode = theme === "dark" ? "dark" : "light";
  const customOn = prefs.bg === "custom";
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, marginBottom: 4 }}>Couleur de fond 🎨</div>
      <div className="muted" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>La teinte du papier, en clair comme en sombre — ou la vôtre. (Réglage par appareil)</div>
      <div className="row wrap" style={{ gap: 12 }}>
        {Object.entries(BG_TINTS).map(([key, t]) => {
          const on = (prefs.bg || "creme") === key;
          return (
            <button key={key} onClick={() => setPrefs((p) => ({ ...p, bg: key }))} style={{ border: 0, background: "none", cursor: "pointer", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: t[mode].bg,
                border: on ? "2.5px solid var(--him)" : "2px solid var(--line)",
                boxShadow: on ? "var(--shadow)" : "var(--shadow-sm)", transform: on ? "scale(1.06)" : "none",
                transition: "transform .16s", display: "grid", placeItems: "center" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: t[mode].bg2, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)" }} />
              </div>
              <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: on ? "var(--him-ink)" : "var(--muted)" }}>{t.label}</div>
            </button>
          );
        })}
        {/* Couleur libre */}
        <label style={{ cursor: "pointer", textAlign: "center", display: "inline-block" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, position: "relative", overflow: "hidden",
            background: customOn ? prefs.customBg : "conic-gradient(from 0deg, #ef7a5d, #e0a236, #6fae6e, #3bb0a3, #5fa8d8, #6d7ae0, #e86a92, #ef7a5d)",
            border: customOn ? "2.5px solid var(--him)" : "2px solid var(--line)",
            boxShadow: customOn ? "var(--shadow)" : "var(--shadow-sm)", transform: customOn ? "scale(1.06)" : "none",
            transition: "transform .16s", display: "grid", placeItems: "center" }}>
            <span style={{ fontSize: 18, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))" }}>{customOn ? "✓" : "🎨"}</span>
            <input type="color" value={prefs.customBg || "#f3e9f7"} onChange={(e) => setPrefs((p) => ({ ...p, bg: "custom", customBg: e.target.value }))}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
          </div>
          <div className="muted" style={{ fontSize: 11, fontWeight: 700, marginTop: 6, color: customOn ? "var(--him-ink)" : "var(--muted)" }}>Perso</div>
        </label>
      </div>
    </div>
  );
}

export default function Reglages({ go }) {
  const { couple, theme, updateCoupleSettings } = useNana();
  const dur = prettyDuration(couple.since);
  const title = couple.nickname ? couple.nickname : `${couple.him.name} & ${couple.her.name}`;
  return (
    <div className="anim-pop">
      <PageHeader title="Réglages" emoji="⚙️" sub="Personnalisez votre Nanamoureux" onBack={() => go("accueil")} />

      {/* Ensemble depuis */}
      <div className="card tilt-l" style={{ padding: 22, marginBottom: 20, textAlign: "center", overflow: "hidden",
        background: "linear-gradient(135deg, var(--him-soft), var(--her-soft))" }}>
        <span className="tape" />
        <div className="kicker" style={{ marginBottom: 6 }}>{title} · ensemble depuis</div>
        <div className="h-hand" style={{ fontSize: 44 }}>{dur.years} an{dur.years > 1 ? "s" : ""}, {dur.months} mois, {dur.days} j</div>
        <div className="muted" style={{ fontWeight: 700, marginTop: 4 }}>soit {dur.totalDays.toLocaleString("fr-FR")} jours d'amour 💛</div>
        <input className="field" type="date" value={couple.since} onChange={(e) => updateCoupleSettings({ since: e.target.value })} style={{ maxWidth: 200, margin: "14px auto 0" }} />
      </div>

      <div className="kicker" style={{ marginBottom: 12 }}>Vos profils</div>
      <div className="dgrid dgrid--2" style={{ marginBottom: 16 }}>
        <PersonEdit who="him" />
        <PersonEdit who="her" />
      </div>

      <NicknameCard />

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row between">
          <div><div style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>Qui utilise l'app ?</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Détermine "Toi" partout dans l'app</div></div>
          <PersonaSwitch />
        </div>
      </div>

      <div className="kicker" style={{ marginBottom: 12 }}>Apparence</div>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row between">
          <div><div style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>Thème {theme === "dark" ? "sombre 🌙" : "clair ☀️"}</div><div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Bascule clair / sombre (par appareil)</div></div>
          <ThemeToggle />
        </div>
      </div>
      <BackgroundPicker />

      <div className="muted" style={{ textAlign: "center", fontSize: 12, fontWeight: 600, marginTop: 18 }}>Nanamoureux · fait avec 💛 pour {couple.him.name} &amp; {couple.her.name}</div>
    </div>
  );
}
