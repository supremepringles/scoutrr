export default function BudgetBar({ cost, budget, warningThreshold }) {
  const numericCost = Number(cost || 0);
  const numericBudget = Number(budget || 0);
  const threshold = Number(warningThreshold ?? 0.9);
  const ratio = numericBudget > 0 ? numericCost / numericBudget : 0;
  const state = ratio >= 1 ? 'Exceeded' : ratio >= threshold ? 'Warning' : 'Healthy';
  return (
    <div className="budget-block">
      <div className="budget-copy">
        <span>{state}</span>
        <span>${numericCost.toFixed(2)} / ${numericBudget.toFixed(2)}</span>
      </div>
      <div className="budget-bar">
        <div className={`budget-fill ${state.toLowerCase()}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
      </div>
    </div>
  );
}
