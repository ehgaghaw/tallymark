import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BANDS, DESK_FEE_BPS, FLAWS, Folio, POSITIONS, DEFAULT_POSITION, ROLL_TIERS, ROLL_BLANK, band, folioRank, folioTokens, folioTraits, fmt, short, traitPoints, rollPoints } from '../lib/ledger';
import { useStore } from '../lib/store';
import { useWallet } from '../lib/wallet';
import { FilterMenu, FolioBody, FolioHead, Modal, PageHead, RollIcon, StatBox, toggle } from '../components/ui';

function BuyModal({ f, onClose }: { f: Folio; onClose: () => void }) {
  const { address, connect } = useWallet();
  const { buy } = useStore();
  const [step, setStep] = useState(0);
  const fee = ((f.price ?? 0) * DESK_FEE_BPS) / 10_000;
  const mine = address === f.holder;
  const checks = ['Folio is held by the program vault', 'Listing price matches the seller\'s signed order', 'Contents match the ledger: nothing has melted', `Seller ${short(f.holder)} still owns the listing`];
  const run = () => { setStep(1); checks.forEach((_, i) => setTimeout(() => setStep(i + 2), 450 * (i + 1))); };
  return (
    <Modal title="Review & buy" onClose={onClose}>
      <div className="post buy-post"><FolioHead f={f} /><FolioBody f={f} showAddress={false} /></div>
      <dl className="post-details buy-terms">
        <dt>You pay</dt><dd><strong>{f.price} SOL</strong> plus a network fee</dd>
        <dt>Seller gets</dt><dd>{((f.price ?? 0) - fee).toFixed(4)} SOL, after the {DESK_FEE_BPS / 100}% Tallymark desk fee</dd>
        <dt>You get</dt><dd>Folio {short(f.address)} with {fmt(folioTokens(f))} tokens</dd>
        <dt>How</dt><dd className="muted">The folio stays in the vault and nothing melts. You become the holder in one transaction, and can keep it, gift it, relist it, or withdraw (which melts).</dd>
      </dl>
      {step > 0 && (
        <ul className="checks">
          {checks.slice(0, Math.max(0, step - 1)).map((c) => <li key={c} className="ok"><span className="check-mark">✓</span><span>{c}</span></li>)}
          {step - 1 < checks.length && <li className="checks-pending"><span className="spinner" /><span className="muted">Running safety checks...</span></li>}
        </ul>
      )}
      {!address ? <button className="btn btn-primary wide" onClick={connect}>Connect wallet to buy</button>
        : mine ? <p className="muted small">This is your own listing. Cancel it from <Link to="/wallet">your wallet</Link>.</p>
        : step === 0 ? <button className="btn btn-primary wide" onClick={run}>Run checks</button>
        : step - 1 < checks.length ? <button className="btn btn-primary wide" disabled>Checking...</button>
        : <button className="btn btn-primary wide" onClick={() => { buy(f.address); onClose(); }}>Buy for {f.price} SOL</button>}
    </Modal>
  );
}

export default function Desk() {
  const { folios } = useStore();
  const listed = folios.filter((f) => f.status === 'listed' && f.price !== undefined);
  const [open, setOpen] = useState<Folio | null>(null);
  const [q, setQ] = useState('');
  const [rar, setRar] = useState<number[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [sort, setSort] = useState<string[]>([]);
  const p = q.trim().replace(/^#/, '').toLowerCase();
  const active = p !== '' || rar.length > 0 || traits.length > 0;
  const fb = (f: Folio) => band(Math.max(folioRank(f), 0));
  const note = (n: number) => (n ? `${n} listed` : '');
  const shown = listed
    .filter((f) => (p === '' || f.segments.some((s) => String(s.strike) === p) || f.address.toLowerCase().includes(p) || f.holder.toLowerCase().includes(p) || (f.roll?.name.toLowerCase().includes(p) ?? false))
      && (!rar.length || rar.includes(fb(f))) && (!traits.length || folioTraits(f).some((t) => traits.includes(t))))
    .sort((a, b) => (sort[0] === 'high' ? b.price! - a.price! : sort[0] === 'low' ? a.price! - b.price! : folioRank(b) - folioRank(a) || a.price! - b.price!));
  const floor = listed.length ? Math.min(...listed.map((f) => f.price!)) : 0;
  const traitOpts = [...POSITIONS.map((x) => x.name), DEFAULT_POSITION.name, ...FLAWS.map((x) => x.name), ...ROLL_TIERS.map((x) => x.name), ROLL_BLANK.name].map((t, i, all) => {
    const rolled = ROLL_TIERS.some((x) => x.name === t) || t === ROLL_BLANK.name;
    return {
      value: t, label: t, note: note(listed.filter((f) => folioTraits(f).includes(t)).length),
      mark: rolled ? <RollIcon points={rollPoints(t)} /> : <i className={`tier-dot t${band(traitPoints(t))}`} />,
      heading: i === 0 ? 'Position' : t === FLAWS[0].name ? 'Flaw' : t === ROLL_TIERS[0].name ? 'Rolled' : undefined,
      
    };
  });

  return (
    <>
      <PageHead title="Collector desk" sub="Sealed folios for sale. The tokens never leave the vault, so their rarity stays intact.">
        <StatBox items={[[fmt(listed.length), 'Listed now'], [listed.length ? String(floor) : '0', 'Floor, SOL']]} />
      </PageHead>
      <section className="strike-search top-search">
        <form className="search-row" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Search all listings by Strike number, folio or wallet" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search listings" />
          <FilterMenu label="Rarity" options={BANDS.map((b, i) => ({ value: i, label: b, mark: <i className={`tier-dot t${i}`} />, note: note(listed.filter((f) => fb(f) === i).length) }))} chosen={rar} onToggle={(v) => setRar(toggle(rar, v))} />
          <FilterMenu label="Trait" options={traitOpts} chosen={traits} onToggle={(v) => setTraits(toggle(traits, v))} />
          <FilterMenu label="Price" options={[{ value: 'low', label: 'Lowest first' }, { value: 'high', label: 'Highest first' }]} chosen={sort} onToggle={(v) => setSort(sort[0] === v ? [] : [v])} />
          <button className="btn btn-primary">Search</button>
        </form>
        {active && <p className="search-summary"><span className="muted">{shown.length} {shown.length === 1 ? 'folio' : 'folios'} match</span><button type="button" className="chip-clear" onClick={() => { setQ(''); setRar([]); setTraits([]); }}>Clear all</button></p>}
      </section>
      {!shown.length && active && <p className="muted">No folios match.</p>}
      {!listed.length && (
        <div className="panel empty">
          <h2>No folios listed right now</h2>
          <p className="muted">Holders seal rare tokens into folios from <Link to="/wallet">their wallet page</Link> and list them here.</p>
        </div>
      )}
      <div className="cards listing-cards">
        {shown.map((f) => (
          <article className="card listing post" key={f.address}>
            <FolioHead f={f} seller />
            <FolioBody f={f} />
            <button className="btn btn-primary wide post-action" onClick={() => setOpen(f)}>Review &amp; buy</button>
          </article>
        ))}
      </div>
      {open && <BuyModal f={open} onClose={() => setOpen(null)} />}
    </>
  );
}
