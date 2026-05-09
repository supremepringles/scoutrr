import ConditionBadge from './ConditionBadge';

export default function ListingCard({ listing }) {
  return (
    <article className="listing-card">
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
          <span className="muted">{listing.age}</span>
        </div>
        <h3>{listing.title}</h3>
        <div className="listing-price-stack">
          <div><span className="muted">Price</span><strong>${Number(listing.price || 0).toFixed(2)}</strong></div>
          <div><span className="muted">Shipping</span><strong>${Number(listing.shipping || 0).toFixed(2)}</strong></div>
          <div><span className="muted">Total</span><strong>${Number(listing.total_cost || 0).toFixed(2)}</strong></div>
        </div>
        <div className="listing-card-actions">
          <span className="muted">{listing.watchName}</span>
          {listing.url ? (
            <a className="button button-primary" href={listing.url} target="_blank" rel="noreferrer">Buy on eBay</a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
