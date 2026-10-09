import { Link, useParams } from 'react-router-dom';
import { strike, STRIKES, STRIKE_SIZE, TIERS, ROLLS, fmt, eraOf } from '../lib/ledger';
import { StrikeCard } from '../components/ui';

export default function StrikePage() {
  const n = Number(useParams().n);
  const s = strike(n);
  if (!s) return <div className="page-head"><div><h1>No Strike #{useParams().n}</h1><p className="page-sub"><Link to="/strikes" className="u">Back to Strikes</Link></p></div></div>;
  const tier = TIERS[s.tier];
  const pct = (s.surviving / STRIKE_SIZE) * 100;
  const era = eraOf(s.n);
  const roll = ROLLS.find((r) => r.results.some((x) => x.n === s.n));
  const near = STRIKES.filter((x) => x.n !== s.n && Math.abs(x.n - s.n) <= 3);
  return (
    <>
      <div className="crumbs u small"><Link to="/strikes">Strikes</Link> / #{s.n}</div>
      <div className={`strike-hero t${s.tier}`}>
        <div className="strike-big">#{s.n}</div>
        <div>
          <div className="u small" style={{ marginBottom: 12 }}><i className="tier-dot" />{tier.name} &middot; {tier.odds}</div>
          <p style={{ margin: 0, maxWidth: '48ch', color: '#444' }}>{tier.blurb}</p>
        </div>
        <div className="hero-actions">
          {s.n > 1 && <Link className="btn" to={`/strike/${s.n - 1}`}>Prev</Link>}
          {s.n < STRIKES.length && <Link className="btn" to={`/strike/${s.n + 1}`}>Next</Link>}
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <h2>Ledger entry</h2>
          <dl className="kv">
            <dt className="u small">Number</dt><dd>#{s.n} of {fmt(STRIKES.length)}</dd>
            <dt className="u small">Era</dt><dd>{era.name} ({era.from}-{era.to})</dd>
            <dt className="u small">Tier</dt><dd>{tier.name}</dd>
            <dt className="u small">Holder</dt><dd>{s.holder}</dd>
            <dt className="u small">Wallets touched</dt><dd>{s.holders}</dd>
            <dt className="u small">Bought</dt><dd>{new Date(s.boughtAt * 1000).toUTCString()}</dd>
            <dt className="u small">Slot</dt><dd>{fmt(s.slot)}</dd>
          </dl>
        </div>
        <div className={`panel t${s.tier}`}>
          <h2>Standing</h2>
          <div className="stat-value">{fmt(s.surviving)}</div>
          <div className="u small muted" style={{ marginBottom: 20 }}>of {fmt(STRIKE_SIZE)} tokens still held</div>
          <div className="bar-row"><div className="bar"><i style={{ width: `${pct}%` }} /></div><span className="small">{pct.toFixed(1)}%</span></div>
          <p className="small muted" style={{ marginTop: 20 }}>
            {pct >= 100 ? 'Fully intact. The mark stands at full strength.' : 'Part of this million has been sold. The mark has melted by the same share.'}
          </p>
          {roll && <p className="small" style={{ marginTop: 12 }}>Tier drawn in <Link to="/rolls" className="u">Roll {roll.id}</Link>.</p>}
        </div>
      </div>
      <div className="section">
        <div className="section-head"><h2>Neighbours</h2><span className="u small muted">Bought around the same time</span></div>
        <div className="cards">{near.map((x) => <StrikeCard key={x.n} s={x} />)}</div>
      </div>
    </>
  );
}
