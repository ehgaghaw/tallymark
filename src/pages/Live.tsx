import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { STRIKES, TIERS, fmt, short } from '../lib/ledger';
import { PageHead } from '../components/ui';

// Replays the preview ledger as a live feed, one entry every couple of seconds.
export default function Live() {
  const [i, setI] = useState(24);
  useEffect(() => { const id = setInterval(() => setI((x) => (x >= STRIKES.length ? 24 : x + 1)), 2200); return () => clearInterval(id); }, []);
  const feed = STRIKES.slice(Math.max(0, i - 24), i).reverse();
  return (
    <>
      <PageHead title="Live" sub="Strikes as they are cut, newest first. In preview this replays the demo ledger.">
        <span className="u small nav-live"><i />Streaming</span>
      </PageHead>
      <div className="table-scroll"><table className="table">
        <thead><tr><th>Strike</th><th>Tier</th><th>Era</th><th>Holder</th><th className="num">Slot</th></tr></thead>
        <tbody>{feed.map((s, k) => (
          <tr key={s.n} className={`link t${s.tier}`} style={k === 0 ? { background: 'var(--soft)' } : undefined} onClick={() => (location.hash = `#/strike/${s.n}`)}>
            <td><Link to={`/strike/${s.n}`}><b>#{s.n}</b></Link></td>
            <td><i className="tier-dot" />{TIERS[s.tier].name}</td><td className="muted">{s.era}</td>
            <td>{short(s.holder, 6)}</td><td className="num">{fmt(s.slot)}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
