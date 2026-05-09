import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import ManualListingForm from '../components/ManualListingForm';

const POLLING_LABELS = { 15: '15m', 30: '30m', 60: '1h', 360: '6h', 720: '12h' };

function formatPollingInterval(value) {
  if (!value || Number(value) === 0) return 'Polling off';
  return `Polling ${POLLING_LABELS[value] || `${value}m`}`;
}

function formatLastUpdated(value) {
  if (!value) return 'Never refreshed';
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return 'Updated recently';
  const diffMs = Date.now() - then.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
}

function buildClonePrefill(watch) {
  return {
    search: watch.query || watch.name || '',
    broad: Boolean(watch.broad),
    build_id: watch.build_id || '',
    category: watch.category || 'Any',
    user_exclusions: watch.user_exclusions || '',
    seller_usernames: watch.seller_usernames || '',
    condition: watch.condition || 'Any',
    region: watch.region || 'US',
    min_price: watch.min_price ?? '',
    max_price: watch.max_price ?? '',
    polling_interval_minutes: watch.polling_interval_minutes ? String(watch.polling_interval_minutes) : 'off',
  };
}

export default function WatchDetail({
  watches,
  onDeleteWatch,
  onRefreshWatch,
  onChooseListing,
  onCreateManualListing,
  onDeleteListing,
  deletingWatchId,
  deletingListingId,
  refreshingWatchId,
  pinningWatchId,
  manualListingBusy,
  watchErrors,
}) {
  const { watchId } = useParams();
  const navigate = useNavigate();
  const watch = watches.find((item) => item.id === watchId);

  if (!watch) {
    return <Navigate to="/watches" replace />;
  }

  const listings = [...(watch.listings || [])].sort((a, b) => Number(a.total_cost || 0) - Number(b.total_cost || 0));
  const deleting = deletingWatchId === watch.id;
  const refreshing = refreshingWatchId === watch.id;
  const pinning = pinningWatchId === watch.id;
  const error = watchErrors?.[watch.id];

  async function handleDelete() {
    const deleted = await onDeleteWatch(watch);
    if (deleted) {
      navigate('/watches');
    }
  }

  function handleClone() {
    navigate('/watches', { state: { prefill: buildClonePrefill(watch) } });
  }

  return (
    <section className="page-grid">
      <div className="watch-detail-header card">
        <div className="watch-detail-topbar">
          <Link className="button button-ghost" to="/watches">Back</Link>
          <div className="watch-detail-actions">
            <button className="button button-ghost" type="button" onClick={handleClone}>Clone</button>
            <button className="button button-ghost button-danger" type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="watch-detail-title-row">
          <div>
            <div className="card-kicker">Watch detail</div>
            <h1>{watch.name}</h1>
          </div>
          <div className="watch-detail-refresh">
            <span className="muted">{formatLastUpdated(watch.last_refreshed)}</span>
            <button className="button button-primary" type="button" onClick={() => onRefreshWatch(watch)} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="pill-row watch-detail-rules">
          <span className="pill pill-neutral">{watch.category || 'Any'}</span>
          <span className="pill pill-neutral">{watch.condition || 'Any'}</span>
          <span className="pill pill-neutral">{watch.region || 'US'}</span>
          <span className="pill pill-neutral">{formatPollingInterval(watch.polling_interval_minutes)}</span>
          <span className="pill">{watch.broad ? 'Broad' : 'Specific'}</span>
          <span className="pill pill-neutral">Seller: {watch.seller_usernames || 'Any'}</span>
          <span className="pill pill-neutral">Exclude: {watch.user_exclusions || 'None'}</span>
          <span className="pill pill-neutral">Min: {watch.min_price != null ? `$${Number(watch.min_price).toFixed(2)}` : 'None'}</span>
          <span className="pill pill-neutral">Max: {watch.max_price != null ? `$${Number(watch.max_price).toFixed(2)}` : 'None'}</span>
        </div>

        {error ? <div className="inline-error">{error}</div> : null}
      </div>

      <ManualListingForm
        watches={watches}
        defaultWatchId={watch.id}
        onSubmit={onCreateManualListing}
        busy={manualListingBusy}
        title="Manual listing"
      />

      {listings.length ? (
        <div className="listing-grid listing-grid-three">
          {listings.map((listing) => {
            const isPinned = Boolean(listing.is_pinned);
            const isTopRunner = watch.top_runner_listing_id === listing.id;
            return (
              <ListingCard
                key={listing.id}
                listing={listing}
                showPin
                showDelete={listing.source_type === 'manual'}
                deleting={deletingListingId === listing.id}
                onDelete={() => onDeleteListing(watch.id, listing)}
                isPinned={isPinned}
                isTopRunner={isTopRunner}
                pinning={pinning}
                onTogglePin={() => onChooseListing(watch, isPinned ? null : listing.id)}
              />
            );
          })}
        </div>
      ) : (
        <section className="card empty-state">
          <div className="card-kicker">Listings</div>
          <h2>No listings loaded</h2>
          <p className="muted">Refresh this watch or add one manually.</p>
        </section>
      )}
    </section>
  );
}
