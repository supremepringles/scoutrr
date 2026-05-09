import { useEffect, useMemo, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Watches from './pages/Watches';
import Builds from './pages/Builds';
import History from './pages/History';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';

export default function App() {
  const [watches, setWatches] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watchFormBusy, setWatchFormBusy] = useState(false);

  async function loadData({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    const [metaRes, watchesRes, buildsRes, historyRes] = await Promise.all([
      fetch(`${API_BASE}/`),
      fetch(`${API_BASE}/watches`),
      fetch(`${API_BASE}/builds`),
      fetch(`${API_BASE}/history`),
    ]);

    const responses = [metaRes, watchesRes, buildsRes, historyRes];
    for (const response of responses) {
      if (!response.ok) {
        throw new Error(`Backend request failed with ${response.status}`);
      }
    }

    const [metaJson, watchesJson, buildsJson, historyJson] = await Promise.all(
      responses.map((response) => response.json())
    );

    setMeta(metaJson);
    setWatches(watchesJson.items || []);
    setBuilds(buildsJson.items || []);
    setHistory(historyJson.items || []);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        await loadData();
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Failed to load Scoutrr backend');
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateWatch(formData) {
    setWatchFormBusy(true);
    setError('');
    try {
      const createRes = await fetch(`${API_BASE}/watches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!createRes.ok) {
        throw new Error(`Watch creation failed with ${createRes.status}`);
      }
      const createdWatch = await createRes.json();

      const ingestRes = await fetch(
        `${API_BASE}/search/watches/${createdWatch.id}/ingest?q=${encodeURIComponent(formData.query)}`,
        { method: 'POST' }
      );
      if (!ingestRes.ok) {
        throw new Error(`Watch ingest failed with ${ingestRes.status}`);
      }

      await loadData({ silent: true });
    } catch (submitError) {
      setError(submitError.message || 'Failed to create watch');
    } finally {
      setWatchFormBusy(false);
    }
  }

  const dashboardListings = useMemo(() => {
    return watches
      .filter((watch) => Array.isArray(watch.listings) && watch.listings.length > 0)
      .flatMap((watch) =>
        watch.listings.map((listing) => ({
          id: listing.id,
          title: listing.title,
          condition: listing.condition || 'Unknown',
          age: `${listing.listing_age_hours || 0}h old`,
          total: Number(listing.total_cost || 0).toFixed(2),
          url: listing.url,
          watchName: watch.name,
        }))
      )
      .sort((a, b) => Number(a.total) - Number(b.total))
      .slice(0, 8);
  }, [watches]);

  return (
    <div className="app-shell">
      <aside className="sidebar card">
        <div>
          <div className="card-kicker">{meta?.name || 'Scoutrr'}</div>
          <h2>Secondhand tech deal finder</h2>
          <p className="muted">Live backend: {API_BASE}</p>
        </div>
        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#watches">Watches</a>
          <a href="#builds">Builds</a>
          <a href="#history">History</a>
        </nav>
      </aside>
      <main className="content">
        {error ? <section className="card error-card">{error}</section> : null}
        {loading ? <section className="card muted">Loading live Scoutrr data…</section> : null}
        <section id="dashboard"><Dashboard watches={watches} builds={builds} listings={dashboardListings} /></section>
        <section id="watches">
          <Watches
            watches={watches}
            builds={builds}
            onCreateWatch={handleCreateWatch}
            busy={watchFormBusy}
          />
        </section>
        <section id="builds"><Builds builds={builds} /></section>
        <section id="history"><History history={history} /></section>
      </main>
    </div>
  );
}
