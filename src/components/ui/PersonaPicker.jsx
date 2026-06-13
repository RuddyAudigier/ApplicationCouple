/* ============================================================
   NANAMOUREUX — Sélecteur "pour qui / payé par" (local, ne change
   pas l'identité globale — contrairement à PersonaSwitch)
   ============================================================ */
import { useNana } from "../../lib/store.jsx";

export function PersonaPicker({ value, onChange }) {
  const { couple } = useNana();
  return (
    <div className="segment">
      {["him", "her"].map((who) => (
        <button key={who} type="button" className={value === who ? "on" : ""} onClick={() => onChange(who)}>
          {couple[who].emoji} {couple[who].name}
        </button>
      ))}
    </div>
  );
}
