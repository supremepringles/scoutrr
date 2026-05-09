export default function History({ history }) {
  return (
    <section className="card">
      <div className="section-head">
        <h2>Sold price history</h2>
        <span className="muted">Intentional comps, not background noise.</span>
      </div>
      <div className="history-list">
        {history.length ? history.map((item) => (
          <div className="listing-row" key={item.id || item.title}>
            <div>
              <strong>{item.title}</strong>
              <div className="muted">{item.query} • Sold {item.sold_at || item.date}</div>
            </div>
            <div className="listing-price">${Number(item.sold_price ?? item.price ?? 0).toFixed(2)}</div>
          </div>
        )) : <div className="muted">No sold comps saved yet.</div>}
      </div>
    </section>
  );
}
