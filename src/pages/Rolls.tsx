import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ALL_ROLL, BANDS, ROLL_BLANK, ROLL_FEE_SOL, ROLL_MIN, RollEvent, band, fmt, isAddress, pctOdds, rollHeld, share, short, solscan } from '../lib/ledger';
import { useStore } from '../lib/store';
import { Feature, FilterMenu, HoverTip, Legend, PageHead, RollIcon, StatBox, toggle, useTip } from '../components/ui';

function RollCard({ e }: { e: RollEvent }) {
  return (
    <li>
      <header className="post-head">
        <RollIcon points={e.points} name={e.name} />
        <span className="post-who"><strong className="strike-title">{e.name}</strong><Link to={`/wallet/${e.holder}`} className="small muted">{short(e.holder)}</Link></span>
        <span className="rarity-tag"><i className={`tier-dot t${band(e.points)}`} />{BANDS[band(e.points)]}</span>
      </header>
      {e.sig ? <a className="small muted card-foot-line" href={solscan('tx', e.sig)} target="_blank" rel="noreferrer">Slot {fmt(e.slot)}</a> : <span className="small muted card-foot-line">Just now</span>}
    </li>
  );
}

/** One row per tier. Each cell is one roll (Blank: ten rolls). Coloured cells still exist; grey were withdrawn. */
function RollChart({ counts, held, focus }: { counts: Record<string, number>; held: Record<string, { count: number }>; focus: string | null }) {
  return (
    <div className="roll-chart" data-focus={focus ?? undefined}>
      {ALL_ROLL.map((t) => {
        const isBlank = t.name === ROLL_BLANK.name;
        const total = counts[t.name] ?? 0;
        const unit = isBlank ? 10 : 1;
        const cells = Math.ceil(total / unit);
        const alive = isBlank ? cells : held[t.name]?.count ?? 0;
        const expected = Math.max(cells, Math.ceil(((t.odds / 1e6) * (Object.values(counts).reduce((a, v) => a + v, 0) + 400)) / unit));
        const b = band(t.points);
        return (
          <div className="roll-row" key={t.name}>
            <span className="roll-row-name"><RollIcon points={t.points} name={t.name} />{t.name}</span>
            <span className="roll-cells">
              {Array.from({ length: expected }, (_, i) => {
                const k = i < alive ? `t${b}` : i < cells ? 'melted' : 'unissued';
                const tipText = i < cells ? `${t.name}|${BANDS[b]} · ${fmt(total)} rolled · ${isBlank ? '1 cell = 10 rolls' : `${held[t.name]?.count ?? 0} still sealed`}` : `${t.name}|not rolled yet`;
                return <i key={i} className={`rc rc-${k}`} data-k={k} data-tip={tipText} data-tier={i < alive ? String(b) : i < cells ? 'm' : 'u'} />;
              })}
            </span>
            <span className="roll-row-count mono small">{fmt(total)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Rolls() {
  const nav = useNavigate();
  const { feed, counts, folios } = useStore();
  const held = rollHeld(folios);
  const total = Object.values(counts).reduce((a, v) => a + v, 0);
  const heldNow = Object.values(held).reduce((a, h) => a + h.count, 0);
  const [q, setQ] = useState('');
  const [rar, setRar] = useState<number[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const focus = hover ?? pin;
  const { tip, onMove, clear } = useTip();

  const c = q.trim().toLowerCase();
  const match = (points: number, name: string) => (!rar.length || rar.includes(band(points))) && (!tiers.length || tiers.includes(name));
  const tierRows = ALL_ROLL.filter((t) => match(t.points, t.name) && (!c || t.name.toLowerCase().includes(c) || BANDS[band(t.points)].toLowerCase().includes(c)));
  const active = !!c || rar.length > 0 || tiers.length > 0;
  const recent = feed.slice(0, 200);
  const found = recent.filter((e) => match(e.points, e.name) && (!c || e.name.toLowerCase().includes(c) || e.holder.toLowerCase().startsWith(c)));
  const bandShare = (b: number) => (total ? share(ALL_ROLL.filter((t) => band(t.points) === b).reduce((a, t) => a + (counts[t.name] ?? 0), 0), total) : '');

  return (
    <div className="roll-page">
      <PageHead title="Rolled tiers" sub="After the curve. Ordinary $TALLY sealed in a folio can roll for one of these tiers.">
        <StatBox items={[[fmt(total), 'Rolls so far'], [fmt(heldNow), 'Rolled rares held now']]} />
      </PageHead>

      <section className="strike-search top-search">
        <form className="search-row" onSubmit={(e) => { e.preventDefault(); if (isAddress(q.trim())) nav(`/wallet/${q.trim()}`); }}>
          <input placeholder="Search all rolls by tier, like Grand Total, or by wallet" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tier or wallet" />
          <FilterMenu label="Tier" options={ALL_ROLL.map((t) => ({ value: t.name, label: t.name, mark: <RollIcon points={t.points} />, note: total ? share(counts[t.name] ?? 0, total) : '' }))} chosen={tiers} onToggle={(v) => setTiers(toggle(tiers, v))} />
          <FilterMenu label="Rarity" options={BANDS.map((b, i) => ({ value: i, label: b, mark: <i className={`tier-dot t${i}`} />, note: bandShare(i) }))} chosen={rar} onToggle={(v) => setRar(toggle(rar, v))} />
          <button className="btn btn-primary">Search</button>
        </form>
        {active && <p className="search-summary"><span className="muted">{tierRows.length} {tierRows.length === 1 ? 'tier' : 'tiers'} and {found.length} {found.length === 1 ? 'roll' : 'rolls'} match</span><button type="button" className="chip-clear" onClick={() => { setQ(''); setRar([]); setTiers([]); }}>Clear all</button></p>}
      </section>

      {active ? (
        <section className="panel">
          <div className="panel-head panel-head-stack"><h2>{found.length} {found.length === 1 ? 'roll' : 'rolls'} found</h2><p className="muted list-sub">Matching your search among the latest {recent.length} rolls, newest first.</p></div>
          {found.length ? <ul className="strike-feature">{found.slice(0, 40).map((e, i) => <RollCard key={e.sig || i} e={e} />)}</ul> : <p className="muted small">No rolls match.</p>}
        </section>
      ) : (
        <Feature title="Latest rolls" sub="The newest rolls, as they land on the chain.">
          <ul className="strike-feature">{feed.slice(0, 5).map((e, i) => <RollCard key={e.sig || i} e={e} />)}</ul>
        </Feature>
      )}

      <div className="tabs" role="tablist" aria-label="View"><button type="button" role="tab" aria-selected className="tab on">Rolled tiers</button></div>
      <section className="panel tabbed" data-focus={focus ?? undefined}>
        <div className="view-head">
          <p className="muted view-line">Ordinary $TALLY sealed in a folio can roll for one of these tiers ({ROLL_FEE_SOL} SOL per roll, {fmt(ROLL_MIN)} minimum). No caps: the counts grow with every roll and shrink when folios are withdrawn. <Link to="/wallet">Roll yours</Link></p>
          <Legend shares={[0, 1, 2, 3].map(bandShare)} focus={focus} onFocus={setHover} onPin={(k) => setPin(pin === k ? null : k)} extra={[['melted', 'Withdrawn'], ['unissued', 'Not rolled yet']]} />
        </div>
        <div className="roll-curve-box" onMouseMove={onMove} onMouseLeave={clear}><RollChart counts={counts} held={held} focus={focus} /></div>
        <HoverTip tip={tip} />
      </section>

      <section className="panel">
        <div className="panel-head panel-head-stack"><h2>Odds by tier</h2><p className="muted list-sub">How many of each have been rolled, how many still exist, and the lowest price on the desk.</p></div>
        <div className="table-scroll">
          <table className="table odds roll-stats">
            <thead><tr><th>Tier</th><th>Rarity</th><th className="num">Points</th><th className="num">Chance</th><th className="num">Rolled</th><th className="num">Exist now</th><th className="num">Listed</th><th className="num">Floor</th></tr></thead>
            <tbody>{tierRows.map((t) => {
              const h = held[t.name]; const blank = t.name === ROLL_BLANK.name;
              return (
                <tr key={t.name} data-band={band(t.points)}>
                  <td><span className="tier-name"><RollIcon points={t.points} name={t.name} /> {t.name}</span></td>
                  <td><span className="sv-name"><i className={`tier-dot t${band(t.points)}`} />{BANDS[band(t.points)]}</span></td>
                  <td className="num mono">{t.points}</td>
                  <td className="num mono">{pctOdds(t.odds)}</td>
                  <td className="num mono">{fmt(counts[t.name] ?? 0)}</td>
                  <td className="num mono">{blank ? '—' : fmt(h?.count ?? 0)}</td>
                  <td className="num mono">{blank ? '—' : h?.listed ?? 0}</td>
                  <td className="num mono">{h?.floor ? <Link to="/desk">{h.floor} SOL</Link> : '—'}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
