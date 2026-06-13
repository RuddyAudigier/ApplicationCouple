/* ============================================================
   ÉCRAN — Budget commun
   ============================================================ */
import { useState } from "react";
import { useNana } from "../lib/store.jsx";
import { Icon, Avatar, PageHeader, PersonaPicker, FX } from "../components/ui";

export default function Budget({ go }) {
  const { budget, couple, me, setBudgetTotal, setIncome, addExpense, delExpense } = useNana();
  const [exp, setExp] = useState({ label: "", amount: "", by: me });
  const [split, setSplit] = useState(20);
  const [editTotal, setEditTotal] = useState(false);

  const left = budget.total - budget.spent;
  const pct = budget.total ? Math.min(100, Math.round((budget.spent / budget.total) * 100)) : 0;
  const totalIncome = budget.incomeHim + budget.incomeHer;
  const shareHim = totalIncome ? budget.incomeHim / totalIncome : 0.5;
  const shareHer = 1 - shareHim;

  const submitExpense = (el) => {
    const amt = parseFloat(exp.amount);
    if (!exp.label.trim() || !amt) return;
    addExpense(exp.label.trim(), amt, exp.by);
    FX.burstFrom(el.currentTarget);
    setExp({ label: "", amount: "", by: exp.by });
  };

  return (
    <div className="anim-pop">
      <PageHeader title="Budget commun" emoji="💰" sub="Vos dépenses, réparties justement" onBack={() => go("accueil")} />

      <div className="dgrid dgrid--home" style={{ gridTemplateColumns: "1fr" }}>
        {/* Budget du mois */}
        <div className="card" style={{ padding: 22, marginBottom: 18 }}>
          <div className="row between" style={{ marginBottom: 6 }}>
            <div className="kicker">Budget du mois</div>
            <button className="chip" onClick={() => setEditTotal((v) => !v)}>{editTotal ? "OK" : "Modifier"}</button>
          </div>
          {editTotal ? (
            <div className="row" style={{ gap: 10, margin: "8px 0 14px" }}>
              <input className="field" type="number" value={budget.total} onChange={(e) => setBudgetTotal(parseFloat(e.target.value) || 0)} />
              <span className="muted" style={{ fontWeight: 700 }}>€ / mois</span>
            </div>
          ) : (
            <div className="row between" style={{ alignItems: "flex-end", margin: "6px 0 14px" }}>
              <div className="h-hand" style={{ fontSize: 52, color: "var(--her)" }}>{left}€</div>
              <div className="muted" style={{ fontWeight: 700, fontFamily: "var(--font-ui)" }}>restants sur {budget.total}€</div>
            </div>
          )}
          <div className="track"><i style={{ width: pct + "%", background: pct > 85 ? "linear-gradient(90deg,#ef7a72,var(--him))" : "linear-gradient(90deg,var(--her),#7cbce6)" }} /></div>
          <div className="muted" style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>{budget.spent}€ dépensés · {pct}%</div>
        </div>

        {/* Ajouter dépense + liste */}
        <div className="card" style={{ padding: 20, marginBottom: 18 }}>
          <div className="h2" style={{ marginBottom: 14 }}>Ajouter une dépense</div>
          <div className="row wrap" style={{ gap: 10 }}>
            <input className="field grow" placeholder="Quoi ? (ex: Courses)" value={exp.label} onChange={(e) => setExp((x) => ({ ...x, label: e.target.value }))} style={{ minWidth: 160 }} />
            <input className="field" type="number" placeholder="€" value={exp.amount} onChange={(e) => setExp((x) => ({ ...x, amount: e.target.value }))} style={{ width: 100 }} onKeyDown={(e) => e.key === "Enter" && submitExpense(e)} />
            <button className="btn btn--him" onClick={(e) => submitExpense(e)}><Icon name="plus" width="17" height="17" /></button>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12, fontSize: 12.5 }}>
            <span className="muted" style={{ fontWeight: 700 }}>Payé par</span>
            <PersonaPicker value={exp.by} onChange={(who) => setExp((x) => ({ ...x, by: who }))} />
          </div>
          <div className="stack" style={{ gap: 10, marginTop: 16 }}>
            {budget.expenses.map((e) => (
              <div key={e.id} className="row" style={{ gap: 12, padding: "10px 12px", borderRadius: 14, background: "var(--card-2)" }}>
                <Avatar who={e.by} size={30} />
                <div className="grow">
                  <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14.5 }}>{e.label}</div>
                  <div className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>{couple[e.by].name} · {new Date(e.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
                </div>
                <div style={{ fontFamily: "var(--font-ui)", fontWeight: 800, color: "var(--him)" }}>{e.amount}€</div>
                <button className="iconbtn iconbtn--danger" style={{ width: 30, height: 30 }} onClick={() => delExpense(e.id)}><Icon name="trash" width="15" height="15" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Répartition équitable */}
      <div className="card" style={{ padding: 22, background: "linear-gradient(135deg, var(--him-soft), var(--her-soft))" }}>
        <div className="h2" style={{ marginBottom: 4 }}>⚖️ Répartition équitable</div>
        <div className="muted" style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 18 }}>Chacun paie selon ses revenus — finie la prise de tête.</div>

        <div className="dgrid dgrid--2" style={{ marginBottom: 18 }}>
          {["him", "her"].map((who) => (
            <div key={who} className="card" style={{ padding: 16, borderColor: `var(--${who})` }}>
              <div className="row" style={{ gap: 10, marginBottom: 10 }}><Avatar who={who} size={30} /><div style={{ fontFamily: "var(--font-ui)", fontWeight: 700 }}>Revenus de {couple[who].name}</div></div>
              <div className="row" style={{ gap: 8 }}>
                <input className="field" type="number" value={who === "him" ? budget.incomeHim : budget.incomeHer}
                  onChange={(e) => setIncome(who, parseFloat(e.target.value) || 0)} />
                <span className="muted" style={{ fontWeight: 700 }}>€</span>
              </div>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div className="grow card" style={{ padding: 14, textAlign: "center", minWidth: 130 }}>
            <div className="kicker" style={{ color: "var(--him)" }}>{couple.him.name}</div>
            <div className="h-hand" style={{ fontSize: 36, color: "var(--him)" }}>{(shareHim * 100).toFixed(0)}%</div>
          </div>
          <div className="grow card" style={{ padding: 14, textAlign: "center", minWidth: 130 }}>
            <div className="kicker" style={{ color: "var(--her)" }}>{couple.her.name}</div>
            <div className="h-hand" style={{ fontSize: 36, color: "var(--her)" }}>{(shareHer * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>Calculer la part de chacun sur une dépense</div>
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <input className="field" type="number" value={split} onChange={(e) => setSplit(parseFloat(e.target.value) || 0)} style={{ width: 130 }} />
            <span className="muted" style={{ fontWeight: 700, alignSelf: "center" }}>€ à partager</span>
          </div>
          <div className="row wrap" style={{ gap: 12 }}>
            <div className="grow row between" style={{ padding: "12px 16px", borderRadius: 14, background: "var(--him-soft)", minWidth: 160 }}>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-ui)", color: "var(--him-ink)" }}>{couple.him.name}</span>
              <span style={{ fontWeight: 800, fontFamily: "var(--font-ui)", color: "var(--him-ink)" }}>{(split * shareHim).toFixed(2)}€</span>
            </div>
            <div className="grow row between" style={{ padding: "12px 16px", borderRadius: 14, background: "var(--her-soft)", minWidth: 160 }}>
              <span style={{ fontWeight: 700, fontFamily: "var(--font-ui)", color: "var(--her-ink)" }}>{couple.her.name}</span>
              <span style={{ fontWeight: 800, fontFamily: "var(--font-ui)", color: "var(--her-ink)" }}>{(split * shareHer).toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
