import { Link } from 'react-router-dom';
import { ERAS, STRIKES, TIERS, fmt } from '../lib/ledger';
import { PageHead } from '../components/ui';

export default function Traits() {
  return (
    <>
      <PageHead title="Traits" sub="Two traits per Strike. The era comes from the number. The tier comes from the roll." />
      <section className="section">
        <div className="section-head"><h2>Tiers</h2><span className="u small muted">Rolled after the sale</span></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>Tier</th><th>Odds</th><th>On ledger</th><th>Description</th></tr></thead>
          <tbody>{TIERS.map((t) => (
            <tr key={t.tier} className={`t${t.tier}`}>
              <td><i className="tier-dot" />{t.name}</td><td>{t.odds}</td>
              <td className="num">{fmt(STRIKES.filter((s) => s.tier === t.tier).length)}</td><td className="muted">{t.blurb}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="section">
        <div className="section-head"><h2>Eras</h2><span className="u small muted">Set by Strike number</span></div>
        <div className="table-scroll"><table className="table">
          <thead><tr><th>Era</th><th>Range</th><th>Strikes</th>{TIERS.slice(1).map((t) => <th key={t.tier} className="num">{t.name}</th>)}</tr></thead>
          <tbody>{ERAS.map((e) => {
            const inEra = STRIKES.filter((s) => s.n >= e.from && s.n <= e.to);
            return (
              <tr key={e.name}>
                <td><Link to="/strikes" className="u">{e.name}</Link></td><td>#{e.from} - #{e.to}</td><td className="num">{fmt(inEra.length)}</td>
                {TIERS.slice(1).map((t) => <td key={t.tier} className={`num t${t.tier}`}><i className="tier-dot" />{inEra.filter((s) => s.tier === t.tier).length}</td>)}
              </tr>
            );
          })}</tbody>
        </table></div>
      </section>
    </>
  );
}
