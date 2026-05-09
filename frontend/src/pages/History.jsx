import { useMemo, useState } from 'react';

const initialForm = {
  title: '',
  sold_price: '',
  platform: 'eBay',
  condition: '',
  sold_at: '',
  notes: '',
  listing_url: '',
};

const dateRangeOptions = [
  { value: 'all', label: 'All dates' },
  { value: '0.25', label: '1 week' },
  { value: '1', label: '1 month' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '1 year' },
];

function withinMonths(value, months) {
  if (months === 'all' || !value) {
    return true;
  }
  const soldAt = new Date(value);
  if (Number.isNaN(soldAt.getTime())) {
    return false;
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.round(Number(months) * 30));
  return soldAt >= cutoff;
}

export default function History({ history, onCreateHistory, onDeleteHistory, deletingHistoryId, creatingHistory }) {
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ platform: 'all', condition: 'all', months: 'all' });
  const [sort, setSort] = useState({ key: 'sold_at', direction: 'desc' });

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateHistory({
      title: form.title,
      sold_price: Number(form.sold_price),
      platform: form.platform,
      condition: form.condition || null,
      sold_at: form.sold_at || null,
      notes: form.notes,
      listing_url: form.listing_url,
      source_type: 'Manual',
      source: form.platform,
      query: form.title,
    });
    setForm(initialForm);
  }

  const platforms = useMemo(() => ['all', ...new Set(history.map((item) => item.platform || 'Other'))], [history]);
  const conditions = useMemo(() => ['all', ...new Set(history.map((item) => item.condition).filter(Boolean))], [history]);

  const filteredHistory = useMemo(() => {
    const items = history.filter((item) => {
      if (filters.platform !== 'all' && (item.platform || 'Other') !== filters.platform) {
        return false;
      }
      if (filters.condition !== 'all' && (item.condition || '') !== filters.condition) {
        return false;
      }
      return withinMonths(item.sold_at, filters.months);
    });

    const sorted = [...items].sort((left, right) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      const leftValue = left[sort.key] ?? '';
      const rightValue = right[sort.key] ?? '';

      if (sort.key === 'sold_price') {
        return (Number(leftValue) - Number(rightValue)) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue)) * direction;
    });

    return sorted;
  }, [filters, history, sort]);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  return (
    <section className="history-page">
      <div className="section-head">
        <div>
          <h2>Sold price history</h2>
          <span className="muted">Manual research only. Saved comps stay separate from active listings.</span>
        </div>
      </div>

      <div className="history-layout">
        <form className="card watch-form" onSubmit={handleSubmit}>
          <div className="section-head compact-head">
            <div>
              <h3>Mode A — Manual add</h3>
              <span className="muted">Add exactly the comp you want to keep.</span>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Title / Model</span>
              <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} required />
            </label>
            <label>
              <span>Sold price</span>
              <input type="number" min="0" step="0.01" value={form.sold_price} onChange={(e) => setForm((current) => ({ ...current, sold_price: e.target.value }))} required />
            </label>
            <label>
              <span>Platform</span>
              <select value={form.platform} onChange={(e) => setForm((current) => ({ ...current, platform: e.target.value }))} required>
                <option value="eBay">eBay</option>
                <option value="Craigslist">Craigslist</option>
                <option value="FB Marketplace">FB Marketplace</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              <span>Condition</span>
              <select value={form.condition} onChange={(e) => setForm((current) => ({ ...current, condition: e.target.value }))}>
                <option value="">Unknown</option>
                <option value="New">New</option>
                <option value="Open Box">Open Box</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
              </select>
            </label>
            <label>
              <span>Date sold</span>
              <input type="date" value={form.sold_at} onChange={(e) => setForm((current) => ({ ...current, sold_at: e.target.value }))} />
            </label>
            <label>
              <span>Listing URL</span>
              <input value={form.listing_url} onChange={(e) => setForm((current) => ({ ...current, listing_url: e.target.value }))} placeholder="https://..." />
            </label>
          </div>
          <label>
            <span>Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} rows="4" />
          </label>
          <button className="button button-primary" type="submit" disabled={creatingHistory}>{creatingHistory ? 'Saving…' : 'Save sold comp'}</button>
        </form>

        <div className="card history-mode-card">
          <div className="section-head compact-head">
            <div>
              <h3>Mode B — eBay sold pull</h3>
              <span className="muted">Selective pinning is planned, but not live yet.</span>
            </div>
          </div>
          <div className="coming-soon-box">
            Coming soon — requires additional eBay API access.
          </div>
          <p className="muted">The UI stays explicit here instead of pretending the sold endpoint works when it hasn’t been verified on the production keyset.</p>
        </div>
      </div>

      <section className="card history-table-card">
        <div className="history-filter-bar">
          <select value={filters.platform} onChange={(e) => setFilters((current) => ({ ...current, platform: e.target.value }))}>
            {platforms.map((option) => <option key={option} value={option}>{option === 'all' ? 'All platforms' : option}</option>)}
          </select>
          <select value={filters.condition} onChange={(e) => setFilters((current) => ({ ...current, condition: e.target.value }))}>
            {conditions.map((option) => <option key={option} value={option}>{option === 'all' ? 'All conditions' : option}</option>)}
          </select>
          <select value={filters.months} onChange={(e) => setFilters((current) => ({ ...current, months: e.target.value }))}>
            {dateRangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {filteredHistory.length ? (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th><button type="button" onClick={() => toggleSort('title')}>Title</button></th>
                  <th><button type="button" onClick={() => toggleSort('sold_price')}>Sold Price</button></th>
                  <th><button type="button" onClick={() => toggleSort('platform')}>Platform</button></th>
                  <th><button type="button" onClick={() => toggleSort('condition')}>Condition</button></th>
                  <th><button type="button" onClick={() => toggleSort('sold_at')}>Date</button></th>
                  <th><button type="button" onClick={() => toggleSort('source_type')}>Source</button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id || item.title}>
                    <td>{item.listing_url ? <a href={item.listing_url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}</td>
                    <td>${Number(item.sold_price ?? 0).toFixed(2)}</td>
                    <td>{item.platform || 'Other'}</td>
                    <td>{item.condition || '—'}</td>
                    <td>{item.sold_at || '—'}</td>
                    <td>{item.source_type || 'Manual'}</td>
                    <td>
                      <button className="button button-ghost button-danger" type="button" onClick={() => onDeleteHistory(item)} disabled={deletingHistoryId === item.id}>
                        {deletingHistoryId === item.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="muted">No sold history yet. Add a comp manually or pull from eBay.</div>}
      </section>
    </section>
  );
}
