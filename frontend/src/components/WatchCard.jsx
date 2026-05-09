import ConditionBadge from './ConditionBadge';

const POLLING_LABELS = {
  15: '15m',
  30: '30m',
  60: '1h',
  360: '6h',
  720: '12h',
};

function formatPollingInterval(value) {
  if (!value || Number(value) === 0) {
    return 'Off';
  }
  return POLLING_LABELS[value] || `${value}m`;
}

function formatLastUpdated(value) {
  if (!value) {
    return 'Never refreshed';
  }

  const then = new Date(value);
  if (Number.isNaN(then.getTime())) {
    return 'Updated recently';
  }

  const diffMs = Date.now() - then.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) {
    return 'Updated just now';
  }
  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
}

export default function WatchCard({ watch, onDelete, onRefresh, onChooseListing, onUpdateWatch, deleting, refreshing, pinning, updating, error }) {
  const listings = [...(watch.listings || [])].sort((a, b) => Number(a.total_cost || 0) - Number(b.total_cost || 0));

  return (
    <article className="card watch-card watch-card-detailed">
      <div className="watch-header">
        <div>
          <div className="card-kicker">Watch</div>
          <h3>{watch.name}</h3>
        </div>
        <div className="pill-row compact-pills">
          <span className="pill">{watch.broad ? 'Broad' : 'Specific'}</span>
          <span className="pill pill-neutral">Poll {formatPollingInterval(watch.polling_interval_minutes)}</span>
        </div>
      </div>

      <div className="watch-toolbar">
        <span className="muted">{formatLastUpdated(watch.last_refreshed)}</span>
        <div className="inline-actions">
          <select
            className="watch-inline-select"
            value={watch.polling_interval_minutes || 'off'}
            onChange={(event) => onUpdateWatch(watch, event.target.value === 'off' ? 0 : Number(event.target.value))}
            disabled={updating || refreshing}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="off">Off</option>
          </select>
          <button className="button button-ghost icon-button" type="button" onClick={() => onRefresh(watch)} disabled={refreshing || updating} title="Refresh watch">
            {refreshing ? '⏳' : '↻'}
          </button>
        </div>
      </div>

      {error ? <div className="inline-error">{error}</div> : null}

      <div className="watch-listings detailed-listings">
        {listings.length ? listings.map((listing) => {
          const isPinned = Boolean(listing.is_pinned);
          const isTopRunner = watch.top_runner_listing_id === listing.id;
          return (
            <div className={`watch-listing-detailed ${isTopRunner ? 'top-runner' : ''}`} key={listing.id}>
              <div className="watch-listing-media">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title} className="watch-listing-image" loading="lazy" />
                ) : (
                  <div className="watch-listing-placeholder">S</div>
                )}
              </div>
              <div className="watch-listing-main">
                <strong>{listing.title}</strong>
                <div className="watch-listing-meta">
                  <ConditionBadge condition={listing.condition} />
                  <span className="muted">{listing.listing_age_hours || 0}h old</span>
                </div>
              </div>
              <div className="watch-listing-price">
                <span className="muted">Price + ship</span>
                <strong>${Number(listing.price || 0).toFixed(2)} + ${Number(listing.shipping || 0).toFixed(2)}</strong>
                <span className="muted">Total ${Number(listing.total_cost || 0).toFixed(2)}</span>
              </div>
              <div className="watch-listing-flags">
                {isTopRunner ? <span className="pill top-runner-pill">Top runner</span> : <span className="muted">&nbsp;</span>}
              </div>
              <div className="watch-listing-actions">
                <button
                  className={`button button-ghost icon-button ${isPinned ? 'button-primary' : ''}`}
                  type="button"
                  onClick={() => onChooseListing(watch, isPinned ? null : listing.id)}
                  disabled={pinning}
                  title={isPinned ? 'Unpin listing' : 'Pin listing'}
                >
                  {pinning && isPinned ? '⏳' : '📌'}
                </button>
                {listing.url ? (
                  <a className="button button-primary" href={listing.url} target="_blank" rel="noreferrer">Buy on eBay</a>
                ) : null}
              </div>
            </div>
          );
        }) : <div className="muted">No listings loaded yet.</div>}
      </div>

      <div className="watch-delete-row">
        <button className="button button-ghost button-danger" type="button" onClick={() => onDelete(watch)} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete watch'}
        </button>
      </div>
    </article>
  );
}
