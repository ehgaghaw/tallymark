import { Link } from 'react-router-dom';
import { ALL_ROLL, BANDS, DEFAULT_POSITION, FLAWS, POSITIONS, STRIKE_COUNT, band, fmt, pctOdds, share } from '../lib/ledger';
import { useStore } from '../lib/store';
import { PageHead, RollIcon } from '../components/ui';

export default function Traits() {
  const { strikes } = useStore();
  const surv = (pred: (t: string[]) => boolean) => {
    const l = strikes.filter((s) => pred(s.traits));
    const iss = l.reduce((a, s) => a + s.issued, 0);
    return iss ? `${((l.reduce((a, s) => a + s.surviving, 0) / iss) * 100).toFixed(1)}%` : '—';
  };
  const positions = [...POSITIONS.map((p) => ({ ...p, count: p.to - p.from + 1, range: p.from === p.to ? `#${p.from}` : `#${p.from} to #${p.to}` })), { ...DEFAULT_POSITION, count: STRIKE_COUNT - 26, range: 'All others' }];
  return (
    <>
      <PageHead title="Traits" sub="Every Strike has a position trait, set by its number. Some also have a flaw, drawn after the sale. Their points add up to the Strike's rank." />
      <section className="panel">
        <div className="panel-head panel-head-stack"><h2>Rarity bands</h2><p className="muted list-sub">A Strike's rank decides its band.</p></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>Band</th><th>Points</th><th className="num">Strikes</th><th className="num">Share</th></tr></thead>
          <tbody>{BANDS.map((b, i) => {
            const n = strikes.filter((s) => band(s.rank) === i).length;
            return <tr key={b}><td><span className="sv-name"><i className={`tier-dot t${i}`} />{b}</span></td><td className="mono">{['0', '1 to 29', '30 to 69', '70 and up'][i]}</td><td className="num">{n}</td><td className="num">{share(n, STRIKE_COUNT)}</td></tr>;
          })}</tbody>
        </table></div>
      </section>
      <section className="panel">
        <div className="panel-head panel-head-stack"><h2>Position traits</h2><p className="muted list-sub">Known from the moment a Strike is sold.</p></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>Trait</th><th>Strikes</th><th className="num">Points</th><th className="num">Count</th><th className="num">Surviving</th><th>About</th></tr></thead>
          <tbody>{positions.map((p) => (
            <tr key={p.name}><td><span className="sv-name"><i className={`tier-dot t${band(p.points)}`} />{p.name}</span></td><td className="mono">{p.range}</td><td className="num">{p.points}</td><td className="num">{fmt(p.count)}</td><td className="num">{surv((t) => t.includes(p.name))}</td><td className="muted">{p.blurb}</td></tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="panel">
        <div className="panel-head panel-head-stack"><h2>Flaws</h2><p className="muted list-sub">Drawn once, after the curve sells out, from a Solana block nobody could predict. A Strike has at most one.</p></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>Flaw</th><th>Band</th><th className="num">Points</th><th className="num">Count</th><th className="num">Surviving</th><th>About</th></tr></thead>
          <tbody>{FLAWS.map((f) => (
            <tr key={f.name}><td><span className="sv-name"><i className={`tier-dot t${band(f.points)}`} />{f.name}</span></td><td>{BANDS[band(f.points)]}</td><td className="num">{f.points}</td><td className="num">{f.count}</td><td className="num">{surv((t) => t.includes(f.name))}</td><td className="muted">{f.blurb}</td></tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="panel">
        <div className="panel-head panel-head-stack"><h2>Rolled tiers</h2><p className="muted list-sub">Won by rolling a folio of ordinary $TALLY after the curve. <Link to="/rolls">See live counts</Link></p></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>Tier</th><th>Band</th><th className="num">Points</th><th className="num">Chance</th><th>About</th></tr></thead>
          <tbody>{ALL_ROLL.map((t) => (
            <tr key={t.name}><td><span className="tier-name"><RollIcon points={t.points} /> {t.name}</span></td><td>{BANDS[band(t.points)]}</td><td className="num">{t.points}</td><td className="num">{pctOdds(t.odds)}</td><td className="muted">{t.blurb}</td></tr>
          ))}</tbody>
        </table></div>
      </section>
    </>
  );
}
