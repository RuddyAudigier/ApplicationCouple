/* ============================================================
   ÉCRAN — Agenda
   ============================================================ */
import { useState, useEffect } from "react";
import { useNana, todayISO, localISO } from "../lib/store.jsx";
import { Icon, Avatar, PageHeader, PersonaPicker, useToast } from "../components/ui";

const DOW = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const iso = (d) => localISO(d);
function startOfWeek(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; }
function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function Modal({ children, onClose, title }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 90, background: "rgba(40,30,20,.35)",
      backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="card anim-pop"
        style={{ width: "min(460px, 94%)", padding: 22, marginBottom: "calc(var(--nav-h) + 8px)", maxHeight: "82%", overflow: "auto" }}>
        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="h2">{title}</div>
          <button className="iconbtn" onClick={onClose}><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EventForm({ initial, onSave, onClose }) {
  const { me } = useNana();
  const [f, setF] = useState(initial || { title: "", date: todayISO(), start: "19:00", end: "20:00", by: me });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="stack" style={{ gap: 13 }}>
      <input className="field" autoFocus placeholder="Quoi ? (ex: Dîner resto 🍝)" value={f.title} onChange={(e) => set("title", e.target.value)} />
      <input className="field" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
      <div className="row" style={{ gap: 10 }}>
        <input className="field" type="time" value={f.start} onChange={(e) => set("start", e.target.value)} />
        <input className="field" type="time" value={f.end} onChange={(e) => set("end", e.target.value)} />
      </div>
      <div>
        <div className="kicker" style={{ marginBottom: 8 }}>Pour qui ?</div>
        <PersonaPicker value={f.by} onChange={(who) => set("by", who)} />
      </div>
      <div className="row" style={{ gap: 10, marginTop: 4 }}>
        <button className="btn btn--him grow" onClick={() => { if (f.title.trim()) { onSave(f); onClose(); } }}>Enregistrer</button>
        <button className="btn btn--soft" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}

export default function Agenda({ go }) {
  const { agenda, me, saveEvent, delEvent } = useNana();
  const [view, setView] = useState("semaine");
  const [cursor, setCursor] = useState(new Date());
  const [sel, setSel] = useState(todayISO());
  const [modal, setModal] = useState(null);
  const [toast, showToast] = useToast();

  const evByDay = (dayIso) => agenda.filter((e) => e.date === dayIso).sort((a, b) => (a.start || "").localeCompare(b.start || ""));

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const step = (dir) => {
    const d = new Date(cursor);
    if (view === "mois") d.setMonth(d.getMonth() + dir);
    else if (view === "semaine") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d); setSel(iso(d));
  };

  return (
    <div className="anim-pop">
      {toast}
      <PageHeader title="Agenda" emoji="📅" sub="Vos rendez-vous, à deux" onBack={() => go("accueil")}
        right={<button className="chip" onClick={() => showToast("Synchro Google bientôt dispo 🔗")}><Icon name="link" width="15" height="15" /> Synchroniser</button>} />

      <div className="row between wrap" style={{ gap: 12, marginBottom: 18 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="chip" onClick={() => { setCursor(new Date()); setSel(todayISO()); }}>Aujourd'hui</button>
          <button className="iconbtn" onClick={() => step(-1)}><Icon name="back" /></button>
          <button className="iconbtn" onClick={() => step(1)}><Icon name="chevR" /></button>
          <div className="h2" style={{ textTransform: "capitalize", marginLeft: 4 }}>{monthLabel}</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="segment">
            {["jour", "semaine", "mois"].map((v) => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)} style={{ textTransform: "capitalize" }}>{v}</button>
            ))}
          </div>
          <button className="btn btn--him btn--sm" onClick={() => setModal({ date: sel, start: "19:00", end: "20:00", by: me, title: "" })}>
            <Icon name="plus" width="16" height="16" /> <span className="desktop-only">Ajouter</span>
          </button>
        </div>
      </div>

      {view === "semaine" && <WeekView cursor={cursor} evByDay={evByDay} onAdd={(d) => setModal({ date: d, start: "19:00", end: "20:00", by: me, title: "" })} onSel={(d) => { setSel(d); setView("jour"); }} onDel={delEvent} />}
      {view === "jour" && <DayView day={sel} evByDay={evByDay} onDel={delEvent} onEdit={(e) => setModal(e)} />}
      {view === "mois" && <MonthView cursor={cursor} agenda={agenda} onPick={(d) => { setSel(d); setView("jour"); setCursor(new Date(d)); }} />}

      {modal && (
        <Modal title={modal.id ? "Modifier l'événement" : "Nouvel événement"} onClose={() => setModal(null)}>
          <EventForm initial={modal} onSave={saveEvent} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function EvChip({ e, onDel, onEdit }) {
  return (
    <div className="row" style={{ gap: 8, padding: "8px 10px", borderRadius: 12, background: `var(--${e.by}-soft)`,
      border: `1.5px solid var(--${e.by})` }}>
      <div className="grow" style={{ cursor: onEdit ? "pointer" : "default" }} onClick={() => onEdit && onEdit(e)}>
        <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13.5, color: `var(--${e.by}-ink)` }}>{e.title}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: `var(--${e.by}-ink)`, opacity: .8 }}>{e.start}–{e.end}</div>
      </div>
      {onDel && <button className="iconbtn iconbtn--danger" style={{ width: 30, height: 30 }} onClick={() => onDel(e.id)}><Icon name="trash" width="15" height="15" /></button>}
    </div>
  );
}

function WeekView({ cursor, evByDay, onAdd, onSel, onDel }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addD(start, i));
  const today = todayISO();

  return (
    <>
      {/* DESKTOP — 7 colonnes pleine hauteur */}
      <div className="desktop-only" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12,
        minHeight: "calc(100vh - 290px)", alignItems: "stretch" }}>
        {days.map((d, i) => {
          const di = iso(d); const evs = evByDay(di); const isToday = di === today;
          return (
            <div key={di} className="card" style={{ padding: 12, display: "flex", flexDirection: "column",
              borderColor: isToday ? "var(--him)" : "var(--line)", background: isToday ? "var(--him-soft)" : "var(--card)" }}>
              <div className="row between" style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => onSel(di)}>
                <div>
                  <div className="kicker" style={{ color: isToday ? "var(--him)" : "var(--muted)" }}>{DOW[i]}</div>
                  <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 18, marginTop: 2,
                    color: isToday ? "#fff" : "var(--ink)", background: isToday ? "var(--him)" : "transparent",
                    width: isToday ? 30 : "auto", height: isToday ? 30 : "auto", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>{d.getDate()}</div>
                </div>
                <button className="iconbtn" style={{ width: 28, height: 28 }} onClick={(e) => { e.stopPropagation(); onAdd(di); }}><Icon name="plus" width="15" height="15" /></button>
              </div>
              <div className="stack" style={{ gap: 7, flex: 1 }}>
                {evs.length === 0
                  ? <button onClick={() => onAdd(di)} style={{ flex: 1, minHeight: 60, border: "1.6px dashed var(--line-ink)", borderRadius: 12, background: "transparent", color: "var(--muted)", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 12 }}>+</button>
                  : evs.map((e) => <EvChip key={e.id} e={e} onDel={onDel} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE — liste verticale : tous les jours visibles */}
      <div className="stack mobile-only" style={{ gap: 10 }}>
        {days.map((d, i) => {
          const di = iso(d); const evs = evByDay(di); const isToday = di === today;
          return (
            <div key={di} className="card" style={{ padding: "12px 14px", display: "flex", gap: 14, alignItems: "stretch",
              borderColor: isToday ? "var(--him)" : "var(--line)", background: isToday ? "var(--him-soft)" : "var(--card)" }}>
              <button onClick={() => onSel(di)} style={{ background: "none", border: 0, cursor: "pointer", width: 46, flex: "none", textAlign: "center", paddingTop: 2 }}>
                <div className="kicker" style={{ color: isToday ? "var(--him)" : "var(--muted)", fontSize: 10 }}>{DOW[i]}</div>
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 20, marginTop: 3,
                  color: isToday ? "#fff" : "var(--ink)", background: isToday ? "var(--him)" : "transparent",
                  width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>{d.getDate()}</div>
              </button>
              <div className="grow" style={{ display: "flex", flexDirection: "column", gap: 7, justifyContent: "center", minWidth: 0 }}>
                {evs.length === 0
                  ? <button onClick={() => onAdd(di)} style={{ textAlign: "left", border: 0, background: "none", color: "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: 13.5, fontFamily: "var(--font-body)" }}>Rien de prévu · <span style={{ color: "var(--him)" }}>ajouter</span></button>
                  : evs.map((e) => <EvChip key={e.id} e={e} onDel={onDel} />)}
              </div>
              <button className="iconbtn" style={{ width: 34, height: 34, alignSelf: "center" }} onClick={() => onAdd(di)}><Icon name="plus" width="16" height="16" /></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DayView({ day, evByDay, onDel, onEdit }) {
  const d = new Date(day + "T00:00");
  const evs = evByDay(day);
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="h2" style={{ textTransform: "capitalize", marginBottom: 16 }}>
        {d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
      </div>
      {evs.length === 0 ? (
        <div className="muted" style={{ fontWeight: 700, padding: "16px 0", textAlign: "center" }}>Aucun événement — profitez-en pour improviser 💫</div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {evs.map((e) => (
            <div key={e.id} className="row" style={{ gap: 14 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, color: "var(--muted)", width: 52, textAlign: "right", fontSize: 13 }}>{e.start}</div>
              <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: `var(--${e.by})` }} />
              <div className="grow"><EvChip e={e} onDel={onDel} onEdit={onEdit} /></div>
              <Avatar who={e.by} size={30} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthView({ cursor, agenda, onPick }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = startOfWeek(first);
  const today = todayISO();
  const cells = Array.from({ length: 42 }, (_, i) => addD(start, i));
  const has = (di) => agenda.filter((e) => e.date === di);
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
        {DOW.map((d) => <div key={d} className="kicker" style={{ textAlign: "center" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
        {cells.map((d) => {
          const di = iso(d); const inMonth = d.getMonth() === cursor.getMonth();
          const evs = has(di); const isToday = di === today;
          return (
            <button key={di} onClick={() => onPick(di)} className="card"
              style={{ padding: 6, minHeight: 66, opacity: inMonth ? 1 : 0.4, cursor: "pointer",
                borderColor: isToday ? "var(--him)" : "var(--line)", display: "flex", flexDirection: "column", gap: 4, alignItems: "stretch" }}>
              <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 13, alignSelf: "flex-start",
                color: isToday ? "#fff" : "var(--ink)", background: isToday ? "var(--him)" : "transparent",
                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{d.getDate()}</div>
              <div className="row" style={{ gap: 3, flexWrap: "wrap" }}>
                {evs.slice(0, 3).map((e) => <span key={e.id} style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--${e.by})` }} />)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
