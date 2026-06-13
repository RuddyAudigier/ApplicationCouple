/* ============================================================
   ÉCRAN — Messages (Nous)
   ============================================================ */
import { useState, useRef, useEffect } from "react";
import { useNana } from "../lib/store.jsx";
import { Icon, Avatar, PageHeader } from "../components/ui";

const QUICK = ["💛", "🥰", "Coucou !", "Je t'aime", "À ce soir 😘", "Tu me manques"];

export default function Messages({ go }) {
  const { messages, me, couple, sendMessage } = useNana();
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current && (endRef.current.parentElement.scrollTop = endRef.current.parentElement.scrollHeight);
  }, [messages.length]);

  const send = (value) => {
    const v = (value ?? text).trim();
    if (!v) return;
    sendMessage(v);
    if (value === undefined) setText("");
  };

  return (
    <div className="anim-pop col" style={{ height: "calc(100% - 0px)" }}>
      <PageHeader title="Nous" emoji="💬" sub={`${couple.him.name} & ${couple.her.name} · votre fil à deux`} onBack={() => go("accueil")} />
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 360 }}>
        <div className="scroll" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m) => {
            const mine = m.by === me;
            return (
              <div key={m.id} className="row" style={{ justifyContent: mine ? "flex-end" : "flex-start", gap: 8 }}>
                {!mine && <Avatar who={m.by} size={28} />}
                <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: mine ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                  background: mine ? "var(--him)" : "var(--her-soft)", color: mine ? "#fff" : "var(--ink)",
                  fontWeight: 600, fontSize: 14.5, boxShadow: "var(--shadow-sm)" }}>
                  {m.text}
                  <div style={{ fontSize: 10.5, opacity: .65, marginTop: 3, fontWeight: 700 }}>{new Date(m.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                {mine && <Avatar who={m.by} size={28} />}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div style={{ borderTop: "1.5px solid var(--line)", padding: 12 }}>
          <div className="row hide-scroll" style={{ gap: 7, overflowX: "auto", marginBottom: 10 }}>
            {QUICK.map((q) => <button key={q} className="chip" style={{ flex: "none" }} onClick={() => send(q)}>{q}</button>)}
          </div>
          <div className="row" style={{ gap: 10 }}>
            <input className="field" placeholder={`Écrire en tant que ${couple[me].name}…`} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="btn btn--him btn--fab" onClick={() => send()}><Icon name="send" width="20" height="20" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
