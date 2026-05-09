export default function ListingRow({ listing }) {
  const body = (
    <>
      <div>
        <strong>{listing.title}</strong>
        <div className="muted">
          {listing.watchName ? `${listing.watchName} • ` : ''}
          {listing.condition} • {listing.age}
        </div>
      </div>
      <div className="listing-price">${listing.total}</div>
    </>
  );

  if (listing.url) {
    return (
      <a className="listing-row listing-link" href={listing.url} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }

  return <div className="listing-row">{body}</div>;
}
