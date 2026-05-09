import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WatchRow from '../components/WatchRow';

const CATEGORY_OPTIONS = [
  'Any',
  'Desktop PC',
  'Laptop',
  'RAM',
  'Storage - HDD',
  'Storage - SSD',
  'Storage - NVMe',
  'Networking',
  'GPU',
  'CPU',
  'Server',
  'Raspberry Pi / SBC',
];

const CONDITION_OPTIONS = [
  'Any',
  'New',
  'Open Box',
  'Seller Refurbished',
  'Used - Excellent',
  'Used - Very Good',
  'Used - Good',
  'For Parts / Not Working',
];

const initialForm = {
  search: '',
  broad: false,
  build_id: '',
  category: 'Any',
  user_exclusions: '',
  condition: 'Any',
  min_price: '',
  max_price: '',
  polling_interval_minutes: '60',
};

export default function Watches({
  watches,
  builds,
  onCreateWatch,
  onDeleteWatch,
  deletingWatchId,
  busy,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) {
      return;
    }
    setForm({ ...initialForm, ...prefill });
    setShowAdvanced(Boolean(prefill.user_exclusions || prefill.min_price || prefill.max_price));
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    const searchValue = form.search.trim();
    const created = await onCreateWatch({
      name: searchValue,
      query: searchValue,
      broad: form.broad,
      build_id: form.build_id || null,
      category: form.category,
      user_exclusions: form.user_exclusions || null,
      condition: form.condition,
      min_price: form.min_price ? Number(form.min_price) : null,
      max_price: form.max_price ? Number(form.max_price) : null,
      polling_interval_minutes: form.polling_interval_minutes === 'off' ? 0 : Number(form.polling_interval_minutes),
    });
    if (created) {
      setForm(initialForm);
      setShowAdvanced(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="page-grid">
      <div className="section-head">
        <div>
          <h2>Watches</h2>
          <span className="muted">Category exclusions run automatically. Custom exclusions layer on top when you need them.</span>
        </div>
      </div>

      <form className="card watch-form watch-search-form" onSubmit={handleSubmit}>
        <div className="section-head compact-head">
          <div>
            <h3>Create watch</h3>
          </div>
        </div>

        <div className="watch-search-row">
          <label className="watch-search-input">
            <span>What are you looking for?</span>
            <input
              value={form.search}
              onChange={(e) => updateField('search', e.target.value)}
              placeholder="e.g. ThinkCentre M720q"
              required
            />
          </label>
          <label className="search-toggle-pill">
            <input type="checkbox" checked={form.broad} onChange={(e) => updateField('broad', e.target.checked)} />
            <span>Broad watch</span>
          </label>
        </div>

        <div className="watch-options-row">
          <label>
            <span>Category</span>
            <select value={form.category} onChange={(e) => updateField('category', e.target.value)}>
              {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Condition</span>
            <select value={form.condition} onChange={(e) => updateField('condition', e.target.value)}>
              {CONDITION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Build</span>
            <select value={form.build_id} onChange={(e) => updateField('build_id', e.target.value)}>
              <option value="">Standalone watch</option>
              {builds.map((build) => <option key={build.id} value={build.id}>{build.name}</option>)}
            </select>
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

        <div className="watch-form-footer">
          <button
            className="button button-ghost"
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Hide advanced options' : 'Advanced options'}
          </button>
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create watch'}
          </button>
        </div>

        {showAdvanced ? (
          <div className="watch-advanced-panel">
            <div className="watch-advanced-grid">
              <label>
                <span>Exclude keywords</span>
                <input
                  value={form.user_exclusions}
                  onChange={(e) => updateField('user_exclusions', e.target.value)}
                  placeholder="e.g. case, adapter, lot"
                />
              </label>
              <label>
                <span>Min price</span>
                <input type="number" min="0" step="0.01" value={form.min_price} onChange={(e) => updateField('min_price', e.target.value)} />
              </label>
              <label>
                <span>Max price</span>
                <input type="number" min="0" step="0.01" value={form.max_price} onChange={(e) => updateField('max_price', e.target.value)} />
              </label>
            </div>
          </div>
        ) : null}
      </form>

      <div className="watch-stack">
        {watches.length ? watches.map((watch) => (
          <WatchRow
            key={watch.id || watch.name}
            watch={watch}
            onDelete={onDeleteWatch}
            deleting={deletingWatchId === watch.id}
          />
        )) : <div className="card muted">No watches yet.</div>}
      </div>
    </section>
  );
}
