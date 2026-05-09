import ListingCard from '../components/ListingCard';
import ManualListingForm from '../components/ManualListingForm';

function getRecommendedListings(watches) {
  return watches
    .flatMap((watch) => {
      const listings = [...(watch.listings || [])]
        .sort((a, b) => Number(a.total_cost || 0) - Number(b.total_cost || 0))
        .slice(0, 3);

      return listings.map((listing) => ({
        ...listing,
        watchName: watch.name,
        watchId: watch.id,
        isTopRunner: watch.top_runner_listing_id === listing.id,
      }));
    })
    .sort((a, b) => {
      if (a.isTopRunner !== b.isTopRunner) {
        return a.isTopRunner ? -1 : 1;
      }
      return Number(a.total_cost || 0) - Number(b.total_cost || 0);
    });
}

export default function Dashboard({ watches, onCreateManualListing, manualListingBusy }) {
  const recommendedListings = getRecommendedListings(watches);

  if (!watches.length) {
    return (
      <section className="page-grid">
        <section className="card empty-state">
          <div className="card-kicker">Dashboard</div>
          <h1>No watches yet</h1>
          <p className="muted">Create your first watch to start pulling recommended listings.</p>
        </section>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="dashboard-toolbar">
        <div className="section-head">
          <div>
            <div className="card-kicker">Dashboard</div>
            <h1>Recommended listings</h1>
          </div>
        </div>
        <ManualListingForm
          watches={watches}
          onSubmit={onCreateManualListing}
          busy={manualListingBusy}
          title="Manual listing"
        />
      </div>

      {recommendedListings.length ? (
        <div className="listing-grid listing-grid-three">
          {recommendedListings.map((listing) => (
            <ListingCard
              key={`${listing.watchId}-${listing.id}`}
              listing={listing}
              watchName={listing.watchName}
              showWatchName
              isTopRunner={listing.isTopRunner}
            />
          ))}
        </div>
      ) : (
        <section className="card empty-state">
          <div className="card-kicker">Dashboard</div>
          <h2>No listings yet</h2>
          <p className="muted">Refresh your watches to load listings.</p>
        </section>
      )}
    </section>
  );
}
