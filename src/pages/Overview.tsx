import { Link, useNavigate } from 'react-router-dom';
import { BANDS, STRIKE_COUNT, TOKEN, band, byRarity, fmt, pct, stats } from '../lib/ledger';
import { useStore } from '../lib/store';
import { StrikeCard } from '../components/ui';

export default function Overview() {
  const nav = useNavigate();
  const { strikes, folios, counts } = useStore();
  const st = stats(strikes);
  const top = strikes.filter((s) => s.issued > 0).sort(byRarity).slice(0, 6);
  const rolls = Object.values(counts).reduce((a, v) => a + v, 0);
  return (
    <>
      <section className="hero">
        <h1 className="word"><span>TA</span><span>LL</span><span>YM</span><span>ARK</span></h1>
        <p className="lede">
          Every {TOKEN} costs the same. Some of them are rare. Each million bought off the curve is a numbered Strike, and rarity survives only in the
          wallet that bought it, or sealed in a folio. Anything that leaves either place <strong className="melt-word">melts</strong>, forever.
        </p>
        <div className="hero-actions">
          <Link to="/strikes" className="btn btn-primary">Browse Strikes</Link>
          <Link to="/rules" className="btn">Read the rules</Link>
        </div>
      </section>

      <div className="stats-row">
        {[
          ['Strikes issued', `${fmt(st.issuedStrikes)}`, `of ${STRIKE_COUNT}`],
          ['Still surviving', `${pct(st.surviving, st.issued)}%`, 'of rare tokens'],
          ['Folios sealed', fmt(folios.length), `${folios.filter((f) => f.status === 'listed').length} on the desk`],
          ['Rolls', fmt(rolls), 'after the curve'],
        ].map(([l, v, s]) => <div className="stat" key={l}><div className="stat-label u">{l}</div><div className="stat-value">{v}</div><div className="stat-sub small">{s}</div></div>)}
      </div>

      <section className="section">
        <div className="section-head"><h2>How the count works</h2><span className="u small muted">Four steps</span></div>
        <div className="steps">
          {[
            ['Buy', 'Every token bought off the curve gets a number. Each million is one Strike.'],
            ['Reveal', 'After the sale, a public block draws the flaws. Position plus flaw points is the rank.'],
            ['Hold or seal', 'Keep tokens in the account that bought them, or seal them in a folio. Either way they stay rare.'],
            ['Trade or roll', 'Sell folios on the desk without melting, or roll ordinary tokens for a tier.'],
          ].map(([h, p], i) => <div className="step" key={h}><b className="u small">0{i + 1}</b><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Rarity</h2><Link to="/traits" className="u small">All traits</Link></div>
        <div className="steps">
          {BANDS.map((b, i) => (
            <div className={`step t${i}`} key={b}>
              <b className="u small"><i className="tier-dot" />{['0 points', '1 to 29', '30 to 69', '70 and up'][i]}</b>
              <h3>{b}</h3>
              <p>{fmt(st.byBand[i])} Strikes &middot; {pct(strikes.filter((s) => band(s.rank) === i).reduce((a, s) => a + s.surviving, 0), strikes.filter((s) => band(s.rank) === i).reduce((a, s) => a + s.issued, 0))}% surviving</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Top of the ledger</h2><Link to="/strikes" className="u small">View all</Link></div>
        <ul className="strike-feature">{top.map((s) => <li key={s.n} className="card-link" onClick={(e) => { if (!(e.target as Element).closest('a')) nav(`/strike/${s.n}`); }}><StrikeCard s={s} /></li>)}</ul>
      </section>
    </>
  );
}
