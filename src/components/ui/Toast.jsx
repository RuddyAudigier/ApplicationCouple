/* ============================================================
   NANAMOUREUX — Toast (petit message flottant)
   ============================================================ */
import { useState, useCallback } from "react";

export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(null), 2200); }, []);
  const node = msg ? (
    <div style={{ position: "absolute", left: "50%", bottom: "calc(var(--nav-h) + 18px)", transform: "translateX(-50%)",
      background: "var(--ink)", color: "var(--bg)", padding: "11px 18px", borderRadius: 999, fontWeight: 700,
      fontFamily: "var(--font-ui)", fontSize: 14, boxShadow: "var(--shadow)", zIndex: 80, whiteSpace: "nowrap" }}
      className="anim-pop">{msg}</div>
  ) : null;
  return [node, show];
}
