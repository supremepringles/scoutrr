import { useState } from 'react';
import WatchCard from '../components/WatchCard';

const initialForm = {
  name: '',
  query: '',
  broad: false,
  build_id: '',
  condition: '',
  min_price: '',
  max_price: '',
  polling_interval_minutes: '60',
};

export default function Watches({
  watches,
  builds,
  onCreateWatch,
  onDeleteWatch,
  onRefreshWatch,
  onChooseListing,
  onUpdateWatch,
  deletingWatchId,
  refreshingWatchId,
  pinningWatchId,
  updatingWatchId,
  watchErrors,
  busy,
}) {
  const [form, setForm] = useState(initialForm);

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateWatch({
      name: form.name,
      query: form.query,
      broad: form.broad,
      build_id: form.build_id || null,
      condition: form.condition || null,
      min_price: form.min_price ? Number(form.min_price) : null,
      max_price: form.max_price ? Number(form.max_price) : null,
      polling_interval_minutes: form.polling_interval_minutes === 'off' ? 0 : Number(form.polling_interval_minutes),
    });
    setForm(initialForm);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Watches</h2>
          <span className="muted">Create a watch, refresh it on demand, or let it poll on its own interval.</span>
        </div>
      </div>

      <form className="card watch-form" onSubmit={handleSubmit}>
        <div className="section-head compact-head">
          <div>
            <h3>Create watch</h3>
            <span className="muted">Posts to the live backend, then pulls fresh eBay results.</span>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
          </label>
          <label>
            <span>Search query</span>
            <input value={form.query} onChange={(e) => updateField('query', e.target.value)} required />
          </label>
          <label>
            <span>Build</span>
            <select value={form.build_id} onChange={(e) => updateField('build_id', e.target.value)}>
              <option value="">Standalone watch</option>
              {builds.map((build) => (
                <option key={build.id} value={build.id}>{build.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Condition</span>
            <input value={form.condition} onChange={(e) => updateField('condition', e.target.value)} placeholder="Used, Open Box, New..." />
          </label>
          <label>
            <span>Min price</span>
            <input type="number" min="0" step="0.01" value={form.min_price} onChange={(e) => updateField('min_price', e.target.value)} />
          </label>
          <label>
            <span>Max price</span>
            <input type="number" min="0" step="0.01" value={form.max_price} onChange={(e) => updateField('max_price', e.target.value)} />
          </label>
          <label>
            <span>Polling interval</span>
            <select value={form.polling_interval_minutes} onChange={(e) => updateField('polling_interval_minutes', e.target.value)}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="360">6 hours</option>
              <option value="720">12 hours</option>
              <option value="off">Off</option>
            </select>
          </label>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.broad} onChange={(e) => updateField('broad', e.target.checked)} />
          <span>Broad watch</span>
        </label>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create watch'}</button>
      </form>

      <div className="watch-stack">
        {watches.length ? watches.map((watch) => (
          <WatchCard
            key={watch.id || watch.name}
            watch={watch}
            onDelete={onDeleteWatch}
            onRefresh={onRefreshWatch}
            onChooseListing={onChooseListing}
            onUpdateWatch={onUpdateWatch}
            deleting={deletingWatchId === watch.id}
            refreshing={refreshingWatchId === watch.id}
            pinning={pinningWatchId === watch.id}
            updating={updatingWatchId === watch.id}
            error={watchErrors?.[watch.id]}
          />
        )) : <div className="card muted">No watches yet.</div>}
      </div>
    </section>
  );
}
