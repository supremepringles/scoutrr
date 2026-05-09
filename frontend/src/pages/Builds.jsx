import BudgetBar from '../components/BudgetBar';

export default function Builds({ builds }) {
  return (
    <section>
      <div className="section-head">
        <h2>Build planner</h2>
        <span className="muted">Budget ceiling vs live running cost.</span>
      </div>
      <div className="card-grid">
        {builds.length ? builds.map((build) => (
          <div className="card" key={build.id || build.name}>
            <div className="card-kicker">Build</div>
            <h3>{build.name}</h3>
            <BudgetBar
              cost={build.cost}
              budget={build.budget}
              warningThreshold={build.warning_threshold ?? build.warningThreshold}
            />
            <div className="muted">{build.watch_count || 0} watched part groups</div>
          </div>
        )) : <div className="card muted">No builds yet.</div>}
      </div>
    </section>
  );
}
