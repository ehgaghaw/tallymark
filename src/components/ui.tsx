import { Link } from 'react-router-dom';
import { Strike, TIERS, STRIKE_SIZE, fmt, short } from '../lib/ledger';

export const tierName = (t: number) => TIERS[t].name;

export function StatsRow({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="stats-row">
      {items.map((s) => (
        <div className="stat" key={s.label}>
          <div className="stat-label u">{s.label}</div>
          <div className="stat-value">{s.value}</div>
          {s.sub && <div className="stat-sub small">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function StrikeCard({ s }: { s: Strike }) {
  const pct = (s.surviving / STRIKE_SIZE) * 100;
  return (
    <Link to={`/strike/${s.n}`} className={`card t${s.tier}`}>
      <div className="card-head">
        <div className="strike-no">#{s.n}</div>
        <span className="u small"><i className="tier-dot" />{tierName(s.tier)}</span>
      </div>
      <div className="u small muted">{s.era}</div>
      <div className="bar-row">
        <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        <span className="small num">{pct.toFixed(1)}%</span>
      </div>
      <div className="card-foot">
        <span className="small">{short(s.holder)}</span>
        <span className="pill u small">{fmt(s.surviving)} left</span>
      </div>
    </Link>
  );
}

export function Pager({ page, pages, set }: { page: number; pages: number; set: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums: number[] = [];
  for (let p = Math.max(1, page - 3); p <= Math.min(pages, page + 3); p++) nums.push(p);
  return (
    <div className="pager">
      <button className="u small" disabled={page <= 1} onClick={() => set(page - 1)}>Prev</button>
      <div className="pager-pages">
        {nums[0] > 1 && <><button onClick={() => set(1)}>1</button>{nums[0] > 2 && <span className="muted">...</span>}</>}
        {nums.map((p) => <button key={p} className={p === page ? 'on' : ''} onClick={() => set(p)}>{p}</button>)}
        {nums[nums.length - 1] < pages && <>{nums[nums.length - 1] < pages - 1 && <span className="muted">...</span>}<button onClick={() => set(pages)}>{pages}</button></>}
      </div>
      <button className="u small" disabled={page >= pages} onClick={() => set(page + 1)}>Next</button>
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <p className="page-sub">{sub}</p>}</div>
      {children}
    </div>
  );
}
