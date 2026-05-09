import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Watches from './pages/Watches';
import WatchDetail from './pages/WatchDetail';
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
  const [buildFormBusy, setBuildFormBusy] = useState(false);
  const [historyFormBusy, setHistoryFormBusy] = useState(false);
  const [deletingWatchId, setDeletingWatchId] = useState('');
  const [deletingBuildId, setDeletingBuildId] = useState('');
  const [deletingHistoryId, setDeletingHistoryId] = useState('');
  const [deletingListingId, setDeletingListingId] = useState('');
  const [refreshingWatchId, setRefreshingWatchId] = useState('');
  const [pinningWatchId, setPinningWatchId] = useState('');
  const [updatingWatchId, setUpdatingWatchId] = useState('');
  const [manualListingBusy, setManualListingBusy] = useState(false);
  const [watchErrors, setWatchErrors] = useState({});

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

      const ingestRes = await fetch(`${API_BASE}/search/watches/${createdWatch.id}/ingest`, { method: 'POST' });
      if (!ingestRes.ok) {
        throw new Error(`Watch ingest failed with ${ingestRes.status}`);
      }

      await loadData({ silent: true });
      return createdWatch;
    } catch (submitError) {
      setError(submitError.message || 'Failed to create watch');
      return null;
    } finally {
      setWatchFormBusy(false);
    }
  }

  async function handleCreateBuild(formData) {
    setBuildFormBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/builds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error(`Build creation failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (submitError) {
      setError(submitError.message || 'Failed to create build');
    } finally {
      setBuildFormBusy(false);
    }
  }

  async function handleCreateHistory(formData) {
    setHistoryFormBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error(`History creation failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (submitError) {
      setError(submitError.message || 'Failed to save sold comp');
    } finally {
      setHistoryFormBusy(false);
    }
  }

  async function handleCreateManualListing(watchId, payload) {
    if (!watchId) {
      setError('Choose a watch for the manual listing');
      return null;
    }
    setManualListingBusy(true);
    setWatchErrors((current) => ({ ...current, [watchId]: '' }));
    try {
      const response = await fetch(`${API_BASE}/watches/${watchId}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Manual listing failed with ${response.status}`);
      }
      const created = await response.json();
      await loadData({ silent: true });
      return created;
    } catch (submitError) {
      setError(submitError.message || 'Failed to add manual listing');
      return null;
    } finally {
      setManualListingBusy(false);
    }
  }

  async function handleRefreshWatch(watch) {
    setRefreshingWatchId(watch.id);
    setWatchErrors((current) => ({ ...current, [watch.id]: '' }));
    try {
      const response = await fetch(`${API_BASE}/search/watches/${watch.id}/ingest`, { method: 'POST' });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Refresh failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (refreshError) {
      setWatchErrors((current) => ({
        ...current,
        [watch.id]: refreshError.message || `Failed to refresh ${watch.name}`,
      }));
    } finally {
      setRefreshingWatchId('');
    }
  }

  async function handleChooseListing(watch, listingId) {
    setPinningWatchId(watch.id);
    setWatchErrors((current) => ({ ...current, [watch.id]: '' }));
    try {
      const response = await fetch(`${API_BASE}/watches/${watch.id}/veto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Pin update failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (pinError) {
      setWatchErrors((current) => ({
        ...current,
        [watch.id]: pinError.message || `Failed to update ${watch.name}`,
      }));
    } finally {
      setPinningWatchId('');
    }
  }

  async function handleUpdateWatch(watch, patch) {
    setUpdatingWatchId(watch.id);
    setWatchErrors((current) => ({ ...current, [watch.id]: '' }));
    try {
      const response = await fetch(`${API_BASE}/watches/${watch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Watch update failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (updateError) {
      setWatchErrors((current) => ({
        ...current,
        [watch.id]: updateError.message || `Failed to update ${watch.name}`,
      }));
    } finally {
      setUpdatingWatchId('');
    }
  }

  async function handleDeleteWatch(watch) {
    if (!window.confirm(`Delete watch ${watch.name}?`)) {
      return;
    }
    setDeletingWatchId(watch.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/watches/${watch.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Delete failed with ${response.status}`);
      }
      await loadData({ silent: true });
      return true;
    } catch (deleteError) {
      setError(deleteError.message || `Failed to delete watch ${watch.name}`);
      return false;
    } finally {
      setDeletingWatchId('');
    }
  }

  async function handleDeleteListing(watchId, listing) {
    if (!window.confirm(`Delete listing ${listing.title}?`)) {
      return false;
    }
    setDeletingListingId(listing.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/watches/${watchId}/listings/${listing.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Delete failed with ${response.status}`);
      }
      await loadData({ silent: true });
      return true;
    } catch (deleteError) {
      setError(deleteError.message || `Failed to delete listing ${listing.title}`);
      return false;
    } finally {
      setDeletingListingId('');
    }
  }

  async function handleDeleteBuild(build) {
    if (!window.confirm(`Delete build ${build.name}?`)) {
      return;
    }
    setDeletingBuildId(build.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/builds/${build.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Delete failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (deleteError) {
      setError(deleteError.message || `Failed to delete build ${build.name}`);
    } finally {
      setDeletingBuildId('');
    }
  }

  async function handleDeleteHistory(item) {
    if (!window.confirm(`Delete history entry ${item.title}?`)) {
      return;
    }
    setDeletingHistoryId(item.id);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/history/${item.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Delete failed with ${response.status}`);
      }
      await loadData({ silent: true });
    } catch (deleteError) {
      setError(deleteError.message || `Failed to delete history entry ${item.title}`);
    } finally {
      setDeletingHistoryId('');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar card">
        <div className="sidebar-brand">
          <Link className="wordmark" to="/">Scoutrr</Link>
          <p className="muted">Used gear tracker</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/watches">Watches</NavLink>
          <NavLink to="/builds">Builds</NavLink>
          <NavLink to="/history">Sold history</NavLink>
        </nav>
        <div className="sidebar-meta muted">
          <span>{meta?.theme || 'thinkcentre-dark'}</span>
          <span>{API_BASE}</span>
        </div>
      </aside>
      <main className="content">
        {error ? <section className="card error-card">{error}</section> : null}
        {loading ? <section className="card muted">Loading live Scoutrr data…</section> : null}
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                watches={watches}
                onCreateManualListing={handleCreateManualListing}
                manualListingBusy={manualListingBusy}
              />
            }
          />
          <Route
            path="/watches"
            element={
              <Watches
                watches={watches}
                builds={builds}
                onCreateWatch={handleCreateWatch}
                onDeleteWatch={handleDeleteWatch}
                deletingWatchId={deletingWatchId}
                busy={watchFormBusy}
                defaultRegion={meta?.default_region || 'US'}
              />
            }
          />
          <Route
            path="/watches/:watchId"
            element={
              <WatchDetail
                watches={watches}
                onDeleteWatch={handleDeleteWatch}
                onRefreshWatch={handleRefreshWatch}
                onChooseListing={handleChooseListing}
                onCreateManualListing={handleCreateManualListing}
                onDeleteListing={handleDeleteListing}
                deletingWatchId={deletingWatchId}
                deletingListingId={deletingListingId}
                refreshingWatchId={refreshingWatchId}
                pinningWatchId={pinningWatchId}
                manualListingBusy={manualListingBusy}
                watchErrors={watchErrors}
              />
            }
          />
          <Route
            path="/builds"
            element={
              <Builds
                builds={builds}
                onCreateBuild={handleCreateBuild}
                onDeleteBuild={handleDeleteBuild}
                deletingBuildId={deletingBuildId}
                creatingBuild={buildFormBusy}
              />
            }
          />
          <Route
            path="/history"
            element={
              <History
                history={history}
                onCreateHistory={handleCreateHistory}
                onDeleteHistory={handleDeleteHistory}
                deletingHistoryId={deletingHistoryId}
                creatingHistory={historyFormBusy}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
