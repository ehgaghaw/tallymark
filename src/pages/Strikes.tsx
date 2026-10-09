import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STRIKES, ERAS, TIERS, totals, fmt } from '../lib/ledger';
import { PageHead, Pager, StatsRow, StrikeCard } from '../components/ui';

const PER = 24;

export default function Strikes() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<number | null>(null);
  const [era, setEra] = useState('');
  const [sort, setSort] = useState<'num' | 'survive'>('num');
  const [page, setPage] = useState(1);
  const t = totals();

  const list = useMemo(() => {
    const term = q.trim().replace(/^#/, '');
    let l = STRIKES.filter((s) => (tier === null || s.tier === tier) && (!era || s.era === era));
    if (term) l = /^\d+$/.test(term) ? l.filter((s) => String(s.n).startsWith(term)) : l.filter((s) => s.holder.toLowerCase().includes(term.toLowerCase()));
    if (sort === 'survive') l = [...l].sort((a, b) => b.surviving - a.surviving || a.n - b.n);
    return l;
  }, [q, tier, era, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages);
  const reset = (f: () => void) => { f(); setPage(1); };

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(q.trim().replace(/^#/, ''));
    if (Number.isInteger(n) && n >= 1 && n <= STRIKES.length) nav(`/strike/${n}`);
  };

  return (
    <>
      <PageHead title="Strikes" sub="Every million tokens bought off the curve, numbered in order. Search a number to jump to it, or a wallet to see what it holds." />
      <StatsRow items={[
        { label: 'Total', value: fmt(t.strikes) },
        { label: 'Marked', value: fmt(t.byTier[1]) },
        { label: 'Double', value: fmt(t.byTier[2]) },
        { label: 'Crossed', value: fmt(t.byTier[3]) },
      ]} />
      <form className="search-row" onSubmit={go}>
        <input className="field" placeholder="Strike number or wallet address" value={q} onChange={(e) => reset(() => setQ(e.target.value))} />
        <select className="field" style={{ flex: '0 0 200px', minWidth: 0 }} value={era} onChange={(e) => reset(() => setEra(e.target.value))}>
          <option value="">All eras</option>
          {ERAS.map((x) => <option key={x.name} value={x.name}>{x.name} ({x.from}-{x.to})</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Go</button>
      </form>
      <div className="tabs">
        <button className={`tab${tier === null ? ' on' : ''}`} onClick={() => reset(() => setTier(null))}>All</button>
        {TIERS.map((x) => <button key={x.tier} className={`tab t${x.tier}${tier === x.tier ? ' on' : ''}`} onClick={() => reset(() => setTier(x.tier))}><i className="tier-dot" />{x.name}</button>)}
        <span style={{ flex: 1 }} />
        <button className={`tab${sort === 'num' ? ' on' : ''}`} onClick={() => reset(() => setSort('num'))}>By number</button>
        <button className={`tab${sort === 'survive' ? ' on' : ''}`} onClick={() => reset(() => setSort('survive'))}>Most intact</button>
      </div>
      <div className="filter-note u small">{fmt(list.length)} strikes &middot; page {cur} of {pages}</div>
      {list.length ? (
        <div className="cards">{list.slice((cur - 1) * PER, cur * PER).map((s) => <StrikeCard key={s.n} s={s} />)}</div>
      ) : <div className="panel muted">No Strikes match that search.</div>}
      <Pager page={cur} pages={pages} set={(p) => { setPage(p); window.scrollTo(0, 0); }} />
    </>
  );
}
