import { Link } from 'react-router-dom';
import { ROLLS, TIERS, fmt, short } from '../lib/ledger';
import { PageHead } from '../components/ui';

export default function Rolls() {
  return (
    <>
      <PageHead title="Rolls" sub="Each roll takes a block hash nobody could pick and turns it into tiers. Anyone can re-run the draw from the hash." />
      {ROLLS.map((r) => (
        <div className="roll" key={r.id}>
          <div className="roll-head">
            <div><b>Roll {r.id}</b> <span className="muted small">&middot; slot {fmt(r.slot)}</span></div>
            <span className="small muted" title={r.blockhash}>hash {short(r.blockhash, 8)}</span>
            <span className="small muted">{new Date(r.at * 1000).toUTCString()}</span>
          </div>
          <div className="roll-results">
            {r.results.map((x) => <Link key={x.n} to={`/strike/${x.n}`} className={`t${x.tier}`}><i className="tier-dot" />#{x.n} <span className="muted small">{TIERS[x.tier].name}</span></Link>)}
          </div>
        </div>
      ))}
    </>
  );
}
