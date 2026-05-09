import { useState } from 'react';
import BuildCard from '../components/BuildCard';

const initialForm = {
  name: '',
  budget: '',
  warning_threshold: '0.9',
};

export default function Builds({ builds, onCreateBuild, onDeleteBuild, deletingBuildId, creatingBuild }) {
  const [form, setForm] = useState(initialForm);

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateBuild({
      name: form.name,
      budget: Number(form.budget),
      warning_threshold: Number(form.warning_threshold || 0.9),
    });
    setForm(initialForm);
  }

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Builds</h2>
          <span className="muted">Create budgets, attach watches, and keep the running total honest.</span>
        </div>
      </div>
      <form className="card watch-form" onSubmit={handleSubmit}>
        <div className="section-head compact-head">
          <div>
            <h3>Create build</h3>
            <span className="muted">Simple budget target with a warning threshold.</span>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
          </label>
          <label>
            <span>Budget</span>
            <input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm((current) => ({ ...current, budget: e.target.value }))} required />
          </label>
          <label>
            <span>Warn at ratio</span>
            <input type="number" min="0.1" max="1" step="0.05" value={form.warning_threshold} onChange={(e) => setForm((current) => ({ ...current, warning_threshold: e.target.value }))} required />
          </label>
        </div>
        <button className="button button-primary" type="submit" disabled={creatingBuild}>{creatingBuild ? 'Creating…' : 'Create build'}</button>
      </form>
      <div className="card-grid">
        {builds.length ? builds.map((build) => (
          <BuildCard
            key={build.id || build.name}
            build={build}
            onDelete={onDeleteBuild}
            deleting={deletingBuildId === build.id}
          />
        )) : <div className="card muted">No builds yet.</div>}
      </div>
    </section>
  );
}
