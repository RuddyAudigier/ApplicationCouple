/* ============================================================
   NANAMOUREUX — En-tête de page
   ============================================================ */
import { Icon } from "./icons.jsx";

export function PageHeader({ title, emoji, sub, onBack, right }) {
  return (
    <div className="phead">
      {onBack && (
        <button className="iconbtn mobile-only" onClick={onBack} aria-label="Retour" style={{ width: 44, height: 44 }}>
          <Icon name="back" />
        </button>
      )}
      <div className="phead__title">
        <h1>{title} {emoji && <span>{emoji}</span>}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </div>
  );
}
