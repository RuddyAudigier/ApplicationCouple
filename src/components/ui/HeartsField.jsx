/* ============================================================
   NANAMOUREUX — Petits cœurs flottants (décoratif)
   ============================================================ */
/* eslint-disable react-hooks/purity -- positions aléatoires décoratives, calculées une seule fois via useMemo */
import { useMemo } from "react";

export function HeartsField({ count = 5 }) {
  const hearts = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: 10 + Math.random() * 80,
    delay: Math.random() * 5,
    dur: 4 + Math.random() * 3,
    rot: (Math.random() * 50 - 25) + "deg",
    size: 14 + Math.random() * 10,
    emoji: ["💛", "💙", "❤️", "✨"][i % 4],
  })), [count]);
  return (
    <div className="fx-layer">
      {hearts.map((h, i) => (
        <span key={i} className="fx-heart"
          style={{ left: h.left + "%", bottom: "-10px", fontSize: h.size + "px",
            "--rot": h.rot, animation: `floatUp ${h.dur}s ease-in ${h.delay}s infinite` }}>{h.emoji}</span>
      ))}
    </div>
  );
}
