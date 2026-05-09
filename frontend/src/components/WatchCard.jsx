export default function WatchCard({ watch }) {
  const topRunnerCost = watch.top_runner?.total_cost ?? 0;
  const hasVeto = Boolean(watch.veto_listing_id);

  return (
    <div className="card">
      <div className="card-kicker">Watch</div>
      <h3>{watch.name}</h3>
      <p>{watch.query}</p>
      <div className="pill-row">
        <span className="pill">{watch.broad ? 'Broad' : 'Specific'}</span>
        <span className="pill">Top runner ${Number(topRunnerCost).toFixed(2)}</span>
        <span className="pill">{(watch.listings || []).length} listings</span>
        {hasVeto ? <span className="pill pill-warn">Veto pinned</span> : null}
      </div>
    </div>
  );
}
