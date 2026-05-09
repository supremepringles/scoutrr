import ConditionBadge from './ConditionBadge';

export default function ListingCard({
  listing,
  watchName,
  showWatchName = false,
  showPin = false,
  isPinned = false,
  isTopRunner = false,
  pinning = false,
  onTogglePin,
}) {
  return (
    <article className={`listing-card ${isTopRunner ? 'listing-card-top-runner' : ''}`}>
      <div className="listing-image-wrap">
        {listing.image_url ? (
          <img className="listing-image" src={listing.image_url} alt={listing.title} loading="lazy" />
        ) : (
          <div className="listing-image listing-image-fallback">S</div>
        )}
      </div>
      <div className="listing-card-body">
        <div className="listing-card-head">
          <ConditionBadge condition={listing.condition} />
          <span className="muted">{listing.listing_age_hours || 0}h old</span>
        </div>

        <div className="listing-title-stack">
          {showWatchName && watchName ? <span className="listing-watch-label">{watchName}</span> : null}
          <h3>{listing.title}</h3>
        </div>

        <div className="listing-price-stack">
          <div><span className="muted">Price</span><strong>${Number(listing.price || 0).toFixed(2)}</strong></div>
          <div><span className="muted">Shipping</span><strong>${Number(listing.shipping || 0).toFixed(2)}</strong></div>
          <div><span className="muted">Total</span><strong>${Number(listing.total_cost || 0).toFixed(2)}</strong></div>
        </div>

        <div className="listing-card-footer">
          <div className="listing-card-flags">
            {isTopRunner ? <span className="pill top-runner-pill">Top runner</span> : null}
          </div>
          <div className="listing-card-actions">
            {showPin ? (
              <button
                className={`button button-ghost ${isPinned ? 'button-primary' : ''}`}
                type="button"
                onClick={onTogglePin}
                disabled={pinning}
              >
                {pinning ? 'Updating…' : isPinned ? 'Unpin' : 'Pin'}
              </button>
            ) : null}
            {listing.url ? (
              <a className="button button-primary" href={listing.url} target="_blank" rel="noreferrer">Buy on eBay</a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
