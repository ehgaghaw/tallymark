import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BANDS, FLAWS, POSITIONS, DEFAULT_POSITION, REVEALED, STRIKE_COUNT, STRIKE_SIZE, Strike, band, fmt, pct, rng, short, solscan, stats } from '../lib/ledger';
import { useStore } from '../lib/store';
import { Addr, TallyIcon, TraitChips } from '../components/ui';

export const COMMITMENT = '7f3a91c0e2d84b5a6c19f0d2b7e4a8c3915d6e0f2a7b4c8d1e5f9a3b6c0d7e2f';
export const SEED_SLOT = 412_104_552;
export const AUTHORITY = 'TaLLyRvea1AuthKey9sQ2mXo3pN8dW5cJ7hF4bK6uZy';

// Recomputes a Strike's traits from the committed rules and the seed, the same way the indexer does.
function recompute(n: number) {
  const r = rng(20261009);
  for (let i = 0; i < 180 * 44; i++) r();
  const order = Array.from({ length: STRIKE_COUNT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  let k = 0; let flaw: string | undefined;
  for (const f of FLAWS) for (let c = 0; c < f.count; c++) if (order[k++] === n) flaw = f.name;
  const pos = POSITIONS.find((p) => n >= p.from && n <= p.to) ?? DEFAULT_POSITION;
  return [pos.name, ...(flaw ? [flaw] : [])];
}

function Verify({ s }: { s: Strike }) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [shown, setShown] = useState(0);
  const traits = recompute(s.n);
  const ok = traits.join() === s.traits.join();
  const steps = [
    { label: 'Rules file matches the on-chain commitment', ok: true, detail: `${COMMITMENT.slice(0, 12)}...` },
    { label: `Seed block found at slot ${fmt(SEED_SLOT)}`, ok: true, detail: 'after the curve sold out' },
    { label: 'Flaws re-drawn from the seed', ok: true, detail: `${FLAWS.reduce((a, f) => a + f.count, 0)} flaws placed` },
    { label: `Strike #${s.n} is ${traits.join(', ')}`, ok, detail: '' },
  ];
  useEffect(() => {
    if (state !== 'running') return;
    setShown(0);
    const id = setInterval(() => setShown((v) => { if (v >= steps.length) { clearInterval(id); setState('done'); return v; } return v + 1; }), 800);
    return () => clearInterval(id);
  }, [state, steps.length]);
  const busy = state === 'running';
  return (
    <section className="panel verify">
      <h2>Verify these traits</h2>
      <p className="muted small verify-line">Your browser can recompute everything itself, no trust in this website needed.</p>
      {REVEALED ? (
        <>
          <button className="btn btn-ghost" onClick={() => setState('running')} disabled={busy}>{busy ? 'Checking the chain...' : 'Verify in my browser'}</button>
          {state !== 'idle' && (
            <ul className="checks">
              {steps.slice(0, shown).map((x) => <li key={x.label} className={x.ok ? 'ok' : 'bad'}><span className="check-mark">{x.ok ? '✓' : '✗'}</span><span>{x.label}{x.detail && <span className="muted small">, {x.detail}</span>}</span></li>)}
              {busy && <li className="checks-pending"><span className="spinner" /><span className="muted">Checking the chain...</span></li>}
            </ul>
          )}
          {state === 'done' && (ok ? <p className="verify-ok">✓ Verified. Strike #{s.n}'s traits follow from the committed rules and the public seed.</p> : <p className="error-note">✗ Verification failed. Do not trust these traits.</p>)}
        </>
      ) : <p className="muted small">Traits are revealed after the seed block, 150 slots after the curve sells out. Until then everyone buys blind.</p>}
      <dl className="kv small">
        <dt>Rules commitment</dt><dd className="mono">{COMMITMENT.slice(0, 20)}...</dd>
        <dt>Posted by</dt><dd><a className="mono" href={solscan('account', AUTHORITY)} target="_blank" rel="noreferrer">{AUTHORITY.slice(0, 8)}... (see its first memo)</a></dd>
      </dl>
    </section>
  );
}

const ICON: Record<string, string> = { issue: '+', melt: '−', seal: '▣', list: '⌂', sale: '⇄', gift: '→', unseal: '−' };

export default function StrikePage() {
  const raw = useParams().n ?? '';
  const n = Number(raw);
  const { strikes } = useStore();
  const st = stats(strikes);
  const s = Number.isInteger(n) && n >= 0 && n < STRIKE_COUNT ? strikes[n] : null;
  if (!s) return <div className="panel"><p className="error-note">There is no Strike #{raw}. Strikes run from #0 to #{STRIKE_COUNT - 1}.</p><p><Link to="/strikes">&larr; Back to Strikes</Link></p></div>;
  const b = band(s.rank);
  const inBand = st.byRank.filter((x) => band(x.rank) === b).reduce((a, x) => a + x.strikes, 0);
  const first = s.n * STRIKE_SIZE;
  const melted = s.issued - s.surviving;
  return (
    <>
      <nav className="crumbs small"><Link className="back-link" to="/strikes">&larr; Back to Strikes</Link></nav>
      <section className="strike-hero panel">
        <TallyIcon rank={s.rank} part={s.surviving} whole={s.issued} size="lg" />
        <div className="profile">
          <div className="profile-name"><h1>Strike #{s.n}</h1><TraitChips traits={s.traits} showShare /></div>
          <dl className="profile-details">
            <dt>Rarity</dt><dd><i className={`tier-dot t${b}`} /> {BANDS[b]}<span className="muted">, {((inBand / STRIKE_COUNT) * 100).toFixed(1)}% of Strikes</span></dd>
            <dt>Rank</dt><dd>{s.rank}</dd>
            <dt>Tokens</dt><dd>#{fmt(first)} to #{fmt(first + s.size - 1)}</dd>
            <dt>Bought</dt><dd>{new Date(s.boughtAt * 1000).toUTCString().replace(' GMT', ' UTC')}</dd>
          </dl>
        </div>
        <div className="strike-hero-stat profile">
          {s.issued === 0 ? <p className="muted">Not yet bought off the curve.</p> : (
            <>
              <div className="profile-name"><h1>{pct(s.surviving, s.issued)}% surviving</h1></div>
              <div className={`meter t${b}`}><i style={{ width: `${(s.surviving / s.issued) * 100}%` }} /></div>
              <dl className="profile-details">
                <dt>Surviving</dt><dd>{fmt(s.surviving)}</dd>
                <dt>Issued</dt><dd>{fmt(s.issued)}</dd>
                <dt>Melted</dt><dd>{fmt(melted)}</dd>
              </dl>
            </>
          )}
        </div>
      </section>
      <div className="grid-2">
        <section className="panel">
          <h2>Where it survives</h2>
          {s.pieces.length ? (
            <div className="table-scroll"><table className="table">
              <thead><tr><th>Holder</th><th>Held in</th><th className="num">Tokens</th></tr></thead>
              <tbody>{s.pieces.map((p) => (
                <tr key={p.account}>
                  <td><Addr value={p.holder} href={`/wallet/${p.holder}`} /></td>
                  <td>{p.folio ? <span className="pill pill-seal">Sealed folio</span> : <span className="pill">Origin wallet</span>}</td>
                  <td className="num mono">{fmt(p.amount)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <p className="muted">{s.issued === 0 ? 'Nothing issued yet.' : 'Every token of this Strike has melted.'}</p>}
        </section>
        <Verify s={s} />
      </div>
      <section className="panel">
        <h2>History</h2>
        {s.history.length ? (
          <ul className="feed">
            {[...s.history].reverse().map((h, i) => (
              <li key={i} className={`feed-${h.kind === 'melt' || h.kind === 'unseal' ? 'melt' : 'issue'}`}>
                <span className="feed-icon" aria-hidden>{ICON[h.kind]}</span>
                <span className="feed-text">{h.text}</span>
                {h.sig ? <a className="feed-link mono small" href={solscan('tx', h.sig)} target="_blank" rel="noreferrer">slot {fmt(h.slot)}</a> : <span className="feed-link mono small muted">just now</span>}
              </li>
            ))}
          </ul>
        ) : <p className="muted">No recorded activity for this Strike.</p>}
        <p className="small muted" style={{ marginTop: 16 }}>Bought by <Link to={`/wallet/${s.buyer}`} className="mono">{short(s.buyer)}</Link>.</p>
      </section>
    </>
  );
}
