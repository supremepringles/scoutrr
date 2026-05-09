import ListingCard from '../components/ListingCard';

export default function Dashboard({ watches }) {
  const watchSections = watches
    .map((watch) => ({
      ...watch,
      topListings: [...(watch.listings || [])].sort((a, b) => Number(a.total_cost || 0) - Number(b.total_cost || 0)).slice(0, 4),
    }))
    .filter((watch) => watch.topListings.length > 0);

  if (!watches.length) {
    return (
      <section className="card empty-state">
        <div className="card-kicker">Dashboard</div>
        <h1>No watches yet</h1>
        <p className="muted">Create your first watch and Scoutrr will start pulling listings into the dashboard.</p>
        <a className="button button-primary" href="#watches">Create your first watch</a>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero card hero-card">
        <div className="card-kicker">Recommended from active watches</div>
        <h1>Best current hits</h1>
        <p className="muted">Grouped by watch. Trimmed to the best few results instead of a giant wall.</p>
      </section>

      {watchSections.length ? watchSections.map((watch) => (
        <section className="watch-section" key={watch.id}>
          <div className="section-head">
            <div>
              <div className="card-kicker">{watch.broad ? 'Broad watch' : 'Watch'}</div>
              <h2>{watch.name}</h2>
            </div>
            <a className="view-all-link" href="#watches">View all</a>
          </div>
          <div className="listing-grid">
            {watch.topListings.map((listing) => (
              <ListingCard
                key={listing.id || listing.title}
                listing={{
                  ...listing,
                  age: `${listing.listing_age_hours || 0}h old`,
                  watchName: watch.name,
                }}
              />
            ))}
          </div>
        </section>
      )) : (
        <section className="card empty-state">
          <div className="card-kicker">Dashboard</div>
          <h2>No listings yet</h2>
          <p className="muted">Your watches exist, but none of them have listings loaded yet.</p>
          <a className="button button-primary" href="#watches">Open watches</a>
        </section>
      )}
    </div>
  );
}
