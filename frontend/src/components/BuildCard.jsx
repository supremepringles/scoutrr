export default function BuildCard({ build }) {
  const budget = Number(build.budget || 0);
  const cost = Number(build.cost || 0);
  const warningThreshold = Number(build.warning_threshold ?? build.warningThreshold ?? 0.9);
  const ratio = budget > 0 ? cost / budget : 0;
  const statusClass = ratio >= 1 ? 'danger' : ratio >= warningThreshold ? 'warn' : 'ok';

  return (
    <div className="card">
      <div className="card-kicker">Build</div>
      <h3>{build.name}</h3>
      <p>${cost.toFixed(2)} / ${budget.toFixed(2)}</p>
      <div className="budget-bar">
        <div className={`budget-fill ${statusClass}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
    </div>
  );
}
