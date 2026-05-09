import WatchCard from '../components/WatchCard';
import BuildCard from '../components/BuildCard';
import ListingRow from '../components/ListingRow';

export default function Dashboard({ watches, builds, listings }) {
  return (
    <div className="page-grid">
      <section className="hero card hero-card">
        <div className="card-kicker">Recommended / trending</div>
        <h1>Scoutrr</h1>
        <p>The app leads with the listings already attached to your active watches instead of fake filler.</p>
      </section>
      <section>
        <div className="section-head">
          <h2>Active watches</h2>
        </div>
        <div className="card-grid">
          {watches.length ? watches.map((watch) => <WatchCard key={watch.id || watch.name} watch={watch} />) : <div className="card muted">No active watches yet.</div>}
        </div>
      </section>
      <section>
        <div className="section-head">
          <h2>Build budgets</h2>
        </div>
        <div className="card-grid">
          {builds.length ? builds.map((build) => <BuildCard key={build.id || build.name} build={build} />) : <div className="card muted">No builds yet.</div>}
        </div>
      </section>
      <section className="card">
        <div className="section-head">
          <h2>Listings from active watches</h2>
        </div>
        {listings.length ? listings.map((listing) => <ListingRow key={listing.id || listing.title} listing={listing} />) : <div className="muted">Create a watch to pull live listings into the dashboard.</div>}
      </section>
    </div>
  );
}
