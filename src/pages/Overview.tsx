import { Link } from 'react-router-dom';
import { STRIKES, TIERS, totals, fmt, TOKEN } from '../lib/ledger';
import { StatsRow, StrikeCard } from '../components/ui';

export default function Overview() {
  const t = totals();
  const featured = STRIKES.filter((s) => s.tier >= 2).slice(0, 6);
  return (
    <>
      <section className="hero">
        <h1 className="word"><span>TA</span><span>LL</span><span>YM</span><span>ARK</span></h1>
        <p className="lede">
          Every million {TOKEN} bought off the curve is cut into the ledger as a numbered Strike, in the order it was bought.
          Hold the million and the mark stays. Sell below it and the mark melts. Nothing to mint, nothing to claim.
        </p>
        <div className="hero-actions">
          <Link to="/strikes" className="btn btn-primary">Browse Strikes</Link>
          <Link to="/rules" className="btn">Read the rules</Link>
        </div>
      </section>

      <StatsRow items={[
        { label: 'Strikes cut', value: fmt(t.strikes), sub: 'one per 1,000,000 tokens' },
        { label: 'Still standing', value: fmt(t.strikes - Math.round(t.melted / 1_000_000)), sub: 'full-strength equivalents' },
        { label: 'Holders', value: fmt(t.holders), sub: 'unique wallets' },
        { label: 'Crossed', value: fmt(t.byTier[3]), sub: 'rarest tier' },
      ]} />

      <section className="section">
        <div className="section-head"><h2>How the count works</h2><span className="u small muted">Four steps</span></div>
        <div className="steps">
          {[
            ['Buy', 'Each full million tokens you buy on the curve is counted as one Strike.'],
            ['Number', 'Strikes are numbered by purchase order. Earlier means lower.'],
            ['Roll', 'After the sale, a public block hash decides each Strike tier.'],
            ['Hold', 'Keep the million in the wallet that bought it and the Strike stands.'],
          ].map(([h, p], i) => (
            <div className="step" key={h}><b className="u small">0{i + 1}</b><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Tiers</h2><Link to="/traits" className="u small">All traits</Link></div>
        <div className="steps">
          {TIERS.map((x) => (
            <div className={`step t${x.tier}`} key={x.tier}>
              <b className="u small"><i className="tier-dot" />{x.odds}</b>
              <h3>{x.name}</h3><p>{x.blurb}</p>
              <p className="small muted" style={{ marginTop: 12 }}>{fmt(t.byTier[x.tier])} on the ledger</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Rare marks</h2><Link to="/strikes" className="u small">View all</Link></div>
        <div className="cards">{featured.map((s) => <StrikeCard key={s.n} s={s} />)}</div>
      </section>
    </>
  );
}
