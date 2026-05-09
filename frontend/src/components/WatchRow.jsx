import { Link } from 'react-router-dom';
import ConditionBadge from './ConditionBadge';

const POLLING_LABELS = { 15: '15m', 30: '30m', 60: '1h', 360: '6h', 720: '12h' };

function formatPollingInterval(value) {
  if (!value || Number(value) === 0) return 'Poll off';
  return `Poll ${POLLING_LABELS[value] || `${value}m`}`;
}

export default function WatchRow({ watch, onDelete, deleting }) {
  return (
    <article className="card watch-row">
      <div className="watch-row-main">
        <strong>{watch.name}</strong>
        <div className="pill-row watch-row-pills compact-pills">
          <span className="pill pill-neutral">{watch.category || 'Any'}</span>
          <ConditionBadge condition={watch.condition || 'Any'} />
          <span className="pill pill-neutral">{watch.region || 'US'}</span>
          <span className="pill pill-neutral">{formatPollingInterval(watch.polling_interval_minutes)}</span>
          <span className="pill">{watch.broad ? 'Broad' : 'Specific'}</span>
          {watch.seller_usernames ? <span className="pill pill-neutral">Seller: {watch.seller_usernames}</span> : null}
        </div>
      </div>
      <div className="watch-row-actions">
        <Link className="button button-ghost" to={`/watches/${watch.id}`}>Open</Link>
        <button className="button button-ghost button-danger" type="button" onClick={() => onDelete(watch)} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </article>
  );
}
