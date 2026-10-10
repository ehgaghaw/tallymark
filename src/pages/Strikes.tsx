import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BANDS, FLAWS, POSITIONS, DEFAULT_POSITION, STATUSES, STRIKE_COUNT, band, byRarity, fmt, pct, share, stats, status, traitCount, traitPoints } from '../lib/ledger';
import { useStore } from '../lib/store';
import { Feature, FilterMenu, HoverTip, Legend, PageHead, Pager, StatBox, StrikeCard, toggle, useTip } from '../components/ui';
import { Curve, Gradient, Sheet } from '../components/viz';

type View = 'curve' | 'sheet' | 'gradient';
const PER = 10;

export default function Strikes() {
  const nav = useNavigate();
  const { strikes } = useStore();
  const st = stats(strikes);
  const [q, setQ] = useState('');
  const [rar, setRar] = useState<number[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [stat, setStat] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [view, setViewState] = useState<View>(() => { try { const v = sessionStorage.getItem('strikes-view'); return v === 'sheet' || v === 'gradient' ? v : 'curve'; } catch { return 'curve'; } });
  const setView = (v: View) => { setViewState(v); try { sessionStorage.setItem('strikes-view', v); } catch { /* storage blocked */ } };
  const [hover, setHover] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const focus = hover ?? pin;
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); return () => ro.disconnect();
  }, []);
  const { tip, onMove, clear } = useTip();

  const term = q.replace(/[#,\s]/g, '');
  const active = term !== '' || rar.length > 0 || traits.length > 0 || stat.length > 0;
  const hits = strikes.filter((s) => (term === '' || String(s.n).startsWith(term)) && (!rar.length || rar.includes(band(s.rank))) && (!traits.length || s.traits.some((t) => traits.includes(t))) && (!stat.length || stat.includes(status(s)))).sort(byRarity);
  const pages = Math.max(1, Math.ceil(hits.length / PER));
  const top5 = strikes.filter((s) => s.issued > 0).sort(byRarity).slice(0, 5);
  const bandShare = (b: number) => share(st.byRank.filter((x) => band(x.rank) === b).reduce((a, x) => a + x.strikes, 0), STRIKE_COUNT);
  const clearAll = () => { setQ(''); setRar([]); setTraits([]); setStat([]); setPage(0); };
  const traitOpts = [...POSITIONS, DEFAULT_POSITION, ...FLAWS].map((t, i) => ({
    value: t.name, label: t.name, note: share(traitCount(t.name), STRIKE_COUNT),
    mark: <i className={`tier-dot t${band(traitPoints(t.name))}`} />,
    heading: i === 0 ? 'Position' : t.name === FLAWS[0].name ? 'Flaw' : undefined,
  }));

  return (
    <>
      <PageHead title="Strikes" sub={`On the curve. All ${STRIKE_COUNT} Strikes, their rarity, and how much of each survives, live from the chain.`}>
        <StatBox items={[[fmt(st.issuedStrikes), 'Strikes issued'], [`${pct(st.surviving, st.issued)}%`, 'Still surviving']]} />
      </PageHead>

      <section className="strike-search top-search">
        <form className="search-row" onSubmit={(e) => { e.preventDefault(); if (term && hits.length === 1) nav(`/strike/${hits[0].n}`); else if (term) nav(`/strike/${Number(term)}`); }}>
          <input placeholder={`Search any of the ${STRIKE_COUNT} Strikes, #0 to #${STRIKE_COUNT - 1}`} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} inputMode="numeric" aria-label="Strike number" />
          <FilterMenu label="Trait" options={traitOpts} chosen={traits} onToggle={(v) => { setTraits(toggle(traits, v)); setPage(0); }} />
          <FilterMenu label="Rarity" options={BANDS.map((b, i) => ({ value: i, label: b, mark: <i className={`tier-dot t${i}`} />, note: bandShare(i) }))} chosen={rar} onToggle={(v) => { setRar(toggle(rar, v)); setPage(0); }} />
          <FilterMenu label="Status" options={STATUSES.map(([v, l]) => ({ value: v, label: l, note: String(strikes.filter((s) => status(s) === v).length) }))} chosen={stat} onToggle={(v) => { setStat(toggle(stat, v)); setPage(0); }} />
          <button className="btn btn-primary">Search</button>
        </form>
        {active && <p className="search-summary"><span className="muted">{hits.length} {hits.length === 1 ? 'Strike' : 'Strikes'} match</span><button type="button" className="chip-clear" onClick={clearAll}>Clear all</button></p>}
      </section>

      {active ? (
        <section className="panel">
          <div className="panel-head panel-head-stack"><h2>{hits.length} {hits.length === 1 ? 'Strike' : 'Strikes'} found</h2><p className="muted list-sub">Matching your search, rarest first.</p></div>
          {!hits.length && <p className="muted">No Strikes match.</p>}
          <ul className="strike-feature">{hits.slice(page * PER, page * PER + PER).map((s) => <li key={s.n} className="card-link" onClick={(e) => { if (!(e.target as Element).closest('a')) nav(`/strike/${s.n}`); }}><StrikeCard s={s} /></li>)}</ul>
          <Pager page={page} pages={pages} set={setPage} />
        </section>
      ) : (
        <Feature title="The 5 rarest Strikes" sub="The top of the ledger right now. The ones collectors want.">
          <ul className="strike-feature">{top5.map((s) => <li key={s.n} className="card-link" onClick={(e) => { if (!(e.target as Element).closest('a')) nav(`/strike/${s.n}`); }}><StrikeCard s={s} /></li>)}</ul>
        </Feature>
      )}

      <div className="tabs" role="tablist" aria-label="View">
        {(['curve', 'sheet', 'gradient'] as View[]).map((v) => <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'tab on' : 'tab'} onClick={() => setView(v)}>{v === 'sheet' ? 'Ledger sheet' : v === 'gradient' ? 'Gradient' : 'On the curve'}</button>)}
      </div>
      <section className="panel tabbed" data-focus={focus ?? undefined}>
        <div className="view-head">
          <p className="muted view-line">{view === 'sheet' ? `Every Strike as one block, numbered 0 to ${STRIKE_COUNT - 1}. Colour is rarity.` : view === 'gradient' ? 'The same Strikes blended into one gradient, in buying order. Colour is rarity.' : 'The same Strikes along the bonding curve, in buying order. Each column is a few Strikes.'}</p>
          <Legend shares={[0, 1, 2, 3].map(bandShare)} focus={focus} onFocus={setHover} onPin={(k) => setPin(pin === k ? null : k)} />
        </div>
        <div className={`viz view-${view}`} ref={box} onMouseMove={onMove} onMouseLeave={clear}>
          {view === 'sheet' && <Sheet strikes={strikes} />}
          {view === 'curve' && w > 0 && <div className="curve-view"><Curve strikes={strikes} width={w} /></div>}
          {view === 'gradient' && <div className="curve-view"><Gradient strikes={strikes} focus={focus} /></div>}
        </div>
        <HoverTip tip={tip} />
      </section>

      <section className="panel">
        <div className="panel-head panel-head-stack"><h2>Survival by rarity</h2><p className="muted list-sub">How much of each rarity is still rare. Rare tokens melt when they are sold or sent, so these numbers can only go down.</p></div>
        <div className="table-scroll">
          <table className="table sv-table">
            <thead><tr><th>Rarity</th><th className="num">Rank</th><th className="num">Strikes</th><th>Surviving</th><th className="num">Tokens</th><th className="num">Share</th></tr></thead>
            <tbody>{[...st.byRank].reverse().map((r) => (
              <tr key={r.rank}>
                <td><span className="sv-name"><i className={`tier-dot t${band(r.rank)}`} />{BANDS[band(r.rank)]}</span></td>
                <td className="num">{r.rank}</td><td className="num">{r.strikes}</td>
                <td><div className={`sv-bar t${band(r.rank)}`}><i style={{ width: `${r.issued ? (r.surviving / r.issued) * 100 : 0}%` }} /></div></td>
                <td className="num">{fmt(r.surviving)}</td><td className="num"><strong>{r.issued ? `${pct(r.surviving, r.issued)}%` : 'None'}</strong></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
