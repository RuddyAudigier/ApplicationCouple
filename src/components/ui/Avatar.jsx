/* ============================================================
   NANAMOUREUX — Avatars & Mascotte du couple
   ============================================================ */
import { useNana } from "../../lib/store.jsx";
import { MASCOTS } from "../../lib/themes";

export function Avatar({ who, size = 38, ring }) {
  const { couple } = useNana();
  const p = couple[who];
  const col = p.color || (who === "him" ? "#e25c54" : "#5fa8d8");
  const style = {
    width: size, height: size, fontSize: size * 0.5,
    background: `linear-gradient(145deg, color-mix(in srgb, ${col} 68%, #fff), ${col})`,
  };
  if (ring) style.borderColor = "var(--card)";
  return <span className={`avatar avatar--${who}`} style={style} title={p.name}>{p.emoji}</span>;
}

export function CoupleAvatars({ size = 34 }) {
  return (
    <span className="avatar-stack">
      <Avatar who="him" size={size} />
      <Avatar who="her" size={size} />
    </span>
  );
}

/* Glyph combiné : les deux emojis du couple qui se font face, avec un petit cœur */
export function CoupleGlyph({ size = 66, style }) {
  const { couple } = useNana();
  const s = size;
  return (
    <div className="bob" style={{ position: "relative", width: s, height: s * 0.92, flex: "none", ...style }}>
      <span style={{ position: "absolute", left: 0, top: s * 0.2, fontSize: s * 0.5, lineHeight: 1,
        transform: "rotate(-8deg)", filter: "drop-shadow(0 5px 6px rgba(74,54,30,.28))" }}>{couple.him.emoji}</span>
      <span style={{ position: "absolute", right: 0, top: s * 0.2, fontSize: s * 0.5, lineHeight: 1,
        transform: "rotate(8deg)", filter: "drop-shadow(0 5px 6px rgba(74,54,30,.28))" }}>{couple.her.emoji}</span>
      <span style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", fontSize: s * 0.26,
        zIndex: 3, animation: "bob 2.2s ease-in-out infinite" }}>💛</span>
    </div>
  );
}

/* ---------------- Mascotte (Nano & Moureux) ---------------- */
export function Mascot({ size = 88, style }) {
  const { couple } = useNana();
  const theme = couple.mascot || "blobs";
  const himCol = couple.him.color || "#e25c54";
  const herCol = couple.her.color || "#5fa8d8";
  const s = size;

  if (theme !== "blobs") {
    const m = MASCOTS.find((x) => x.key === theme);
    if (m && m.a) {
      return (
        <div className="mascot bob" style={{ width: s, height: s * 1.02, position: "relative", ...style }}>
          <span style={{ position: "absolute", left: s * 0.0, top: s * 0.24, fontSize: s * 0.52, lineHeight: 1,
            filter: "drop-shadow(0 6px 7px rgba(74,54,30,.28))", transform: "rotate(-7deg)" }}>{m.a}</span>
          <span style={{ position: "absolute", left: s * 0.44, top: s * 0.24, fontSize: s * 0.52, lineHeight: 1,
            filter: "drop-shadow(0 6px 7px rgba(74,54,30,.28))", transform: "rotate(7deg)" }}>{m.b}</span>
          <div style={{ position: "absolute", left: s * 0.43, top: 0, fontSize: s * 0.24, zIndex: 3,
            animation: "bob 2.2s ease-in-out infinite" }}>💛</div>
        </div>
      );
    }
  }

  const blob = (base, left, z, flip) => (
    <div className="blob" style={{
      width: s * 0.62, height: s * 0.7, left, top: s * 0.18, zIndex: z,
      background: `linear-gradient(150deg, color-mix(in srgb, ${base} 64%, #fff), ${base})`,
      boxShadow: "0 8px 16px -8px rgba(74,54,30,.4)",
    }}>
      <div className="eye" style={{ left: flip ? "28%" : "44%", top: "34%" }}>
        <div className="pupil" style={{ left: "26%", top: "26%" }} />
      </div>
      <div className="eye" style={{ left: flip ? "62%" : "70%", top: "34%" }}>
        <div className="pupil" style={{ left: "26%", top: "26%" }} />
      </div>
      <div style={{ position: "absolute", width: "16%", height: "9%", borderRadius: "50%",
        background: "rgba(255,255,255,.35)", left: flip ? "24%" : "40%", top: "50%" }} />
      <div style={{ position: "absolute", width: "26%", height: "13%", left: flip ? "40%" : "50%", top: "56%",
        borderBottom: "2.5px solid rgba(255,255,255,.85)", borderRadius: "0 0 60% 60%" }} />
    </div>
  );
  return (
    <div className="mascot bob" style={{ width: s, height: s * 1.02, ...style }}>
      {blob(herCol, s * 0.30, 1, true)}
      {blob(himCol, s * 0.06, 2, false)}
      <div style={{ position: "absolute", left: s * 0.42, top: s * 0.04, fontSize: s * 0.22, zIndex: 3,
        animation: "bob 2.2s ease-in-out infinite" }}>💛</div>
    </div>
  );
}
