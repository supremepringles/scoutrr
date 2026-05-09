import BudgetBar from './BudgetBar';

export default function BuildCard({ build, onDelete, deleting }) {
  return (
    <div className="card build-card">
      <div className="section-head compact-head">
        <div>
          <div className="card-kicker">Build</div>
          <h3>{build.name}</h3>
        </div>
        <button className="button button-ghost button-danger" type="button" onClick={() => onDelete(build)} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
      <div className="build-stats">
        <div>
          <span className="muted">Budget</span>
          <strong>${Number(build.budget || 0).toFixed(2)}</strong>
        </div>
        <div>
          <span className="muted">Current total</span>
          <strong>${Number(build.cost || 0).toFixed(2)}</strong>
        </div>
      </div>
      <BudgetBar
        cost={build.cost}
        budget={build.budget}
        warningThreshold={build.warning_threshold ?? build.warningThreshold}
      />
      <div className="muted">{build.watch_count || 0} watched part groups</div>
    </div>
  );
}
