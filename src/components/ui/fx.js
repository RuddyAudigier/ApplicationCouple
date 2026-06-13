/* ============================================================
   NANAMOUREUX — Effets (confettis)
   ============================================================ */

export const FX = {
  confetti(x, y) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const layer = document.createElement("div");
    layer.className = "confetti-pc";
    document.body.appendChild(layer);
    const bits = ["💛", "💙", "❤️", "✨", "🎉"];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const el = document.createElement("i");
      const emoji = Math.random() < 0.55;
      el.textContent = emoji ? bits[(Math.random() * bits.length) | 0] : "";
      const sz = 8 + Math.random() * 10;
      Object.assign(el.style, {
        left: x + "px", top: y + "px",
        fontSize: emoji ? 14 + Math.random() * 12 + "px" : "0",
        width: emoji ? "auto" : sz + "px", height: emoji ? "auto" : sz + "px",
        background: emoji ? "none" : ["#e25c54", "#5fa8d8", "#f3c64d", "#7cae6e"][(Math.random() * 4) | 0],
        borderRadius: Math.random() < 0.5 ? "50%" : "3px",
      });
      layer.appendChild(el);
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 150;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - 60;
      const rot = (Math.random() * 720 - 360) + "deg";
      el.animate(
        [
          { transform: "translate(0,0) rotate(0)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy + 160}px) rotate(${rot})`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 600, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" }
      );
    }
    setTimeout(() => layer.remove(), 1700);
  },
  burstFrom(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    FX.confetti(r.left + r.width / 2, r.top + r.height / 2);
  },
};
