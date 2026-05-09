import { useState } from 'react';

const PLATFORM_OPTIONS = ['eBay', 'Facebook Marketplace', 'Craigslist', 'Walmart', 'Best Buy', 'Amazon', 'Other'];

const initialForm = {
  watch_id: '',
  title: '',
  url: '',
  price: '',
  shipping: '',
  platform: 'Other',
  condition: '',
  notes: '',
};

export default function ManualListingForm({ watches, defaultWatchId = '', onSubmit, busy, title = 'Manual listing' }) {
  const [form, setForm] = useState({ ...initialForm, watch_id: defaultWatchId });

  async function handleSubmit(event) {
    event.preventDefault();
    const watchId = defaultWatchId || form.watch_id;
    const created = await onSubmit(watchId, {
      title: form.title.trim(),
      url: form.url.trim(),
      price: Number(form.price),
      shipping: form.shipping ? Number(form.shipping) : 0,
      source: form.platform,
      source_type: 'manual',
      condition: form.condition.trim() || 'Unknown',
      notes: form.notes.trim(),
    });
    if (created) {
      setForm({ ...initialForm, watch_id: defaultWatchId });
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="card manual-listing-form" onSubmit={handleSubmit}>
      <div className="section-head compact-head">
        <div>
          <h3>{title}</h3>
        </div>
      </div>

      {!defaultWatchId ? (
        <label>
          <span>Watch</span>
          <select value={form.watch_id} onChange={(e) => updateField('watch_id', e.target.value)} required>
            <option value="">Choose watch</option>
            {watches.map((watch) => <option key={watch.id} value={watch.id}>{watch.name}</option>)}
          </select>
        </label>
      ) : null}

      <div className="manual-listing-grid">
        <label>
          <span>Title</span>
          <input value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
        </label>
        <label>
          <span>URL</span>
          <input value={form.url} onChange={(e) => updateField('url', e.target.value)} />
        </label>
        <label>
          <span>Price</span>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
        </label>
        <label>
          <span>Shipping cost</span>
          <input type="number" min="0" step="0.01" value={form.shipping} onChange={(e) => updateField('shipping', e.target.value)} />
        </label>
        <label>
          <span>Platform</span>
          <select value={form.platform} onChange={(e) => updateField('platform', e.target.value)}>
            {PLATFORM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Condition</span>
          <input value={form.condition} onChange={(e) => updateField('condition', e.target.value)} required />
        </label>
      </div>

      <label>
        <span>Notes</span>
        <textarea rows="3" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
      </label>

      <div className="watch-form-footer">
        <span className="muted">Manual listings stay put across refreshes until deleted.</span>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add manual listing'}</button>
      </div>
    </form>
  );
}
