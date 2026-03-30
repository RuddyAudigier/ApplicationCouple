import React, { useState } from "react";
import "./Page6.css";

export default function Page6() {
  const [revenu1, setRevenu1] = useState(0);
  const [revenu2, setRevenu2] = useState(0);
  const [depenses, setDepenses] = useState(0);

  let pourcentage1 = 0;
  let pourcentage2 = 0;
  let part1 = 0;
  let part2 = 0;
  const totalRevenus = Number(revenu1) + Number(revenu2);
  if (totalRevenus > 0) {
    pourcentage1 = revenu1 / totalRevenus * 100;
    pourcentage2 = revenu2 / totalRevenus * 100;
    part1 = depenses * (pourcentage1 / 100);
    part2 = depenses * (pourcentage2 / 100);
  }

  return (
    <div className="page1-root">
      <h2>Répartition équitable des dépenses</h2>
      <div className="revenus-row">
        <div className="personne">
          <h3>Personne 1</h3>
          <input
            type="number"
            placeholder="Revenus mensuels (€)"
            value={revenu1}
            min={0}
            onChange={e => setRevenu1(Number(e.target.value))}
          />
        </div>
        <div className="personne">
          <h3>Personne 2</h3>
          <input
            type="number"
            placeholder="Revenus mensuels (€)"
            value={revenu2}
            min={0}
            onChange={e => setRevenu2(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="resultat-block">
        <h3>Pourcentage de participation</h3>
        <div className="pourcentages">
          {totalRevenus > 0 ? (
            <>
              <div>Personne 1 : {pourcentage1.toFixed(1)}%</div>
              <div>Personne 2 : {pourcentage2.toFixed(1)}%</div>
            </>
          ) : (
            <div>Remplissez les revenus pour voir la répartition.</div>
          )}
        </div>
      </div>

      <div className="depenses-block">
        <h3>Calculer la part de chacun</h3>
        <input
          type="number"
          placeholder="Dépenses mensuelles (€)"
          value={depenses}
          min={0}
          onChange={e => setDepenses(Number(e.target.value))}
        />
        <div className="depenses-resultat">
          {totalRevenus > 0 && depenses > 0 ? (
            <>
              <div>Personne 1 doit payer : <b>{part1.toFixed(2)} €</b></div>
              <div>Personne 2 doit payer : <b>{part2.toFixed(2)} €</b></div>
            </>
          ) : (
            <div>Entrez une dépense pour voir la répartition.</div>
          )}
        </div>
      </div>
    </div>
  );
}
