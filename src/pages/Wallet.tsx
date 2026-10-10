import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BANDS, DESK_FEE_BPS, Folio, ROLL_FEE_SOL, ROLL_MIN, Segment, STRIKE_SIZE, band, fmt, folioTokens, isAddress, short } from '../lib/ledger';
import { useStore } from '../lib/store';
import { useWallet } from '../lib/wallet';
import { Addr, ConfirmWord, Feature, FolioBody, FolioHead, Modal, PageHead, RollIcon, StatBox, StrikeCard } from '../components/ui';

type Acct = { account: string; segments: Segment[] };

function Origin({ a, own }: { a: Acct; own: boolean }) {
  const { strikes, seal } = useStore();
  const [sel, setSel] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const picked = a.segments.filter((s) => sel.includes(s.strike));
  const tokens = picked.reduce((x, s) => x + s.amount, 0);
  const flip = (n: number) => setSel(sel.includes(n) ? sel.filter((x) => x !== n) : sel.length < 8 ? [...sel, n] : sel);
  return (
    <div className="origin">
      <div className="origin-head"><span className="origin-acct"><span className="muted">Token account</span> <Addr value={a.account} /></span></div>
      <div className="cards wallet-folios token-cards">
        {a.segments.map((g) => (
          <article key={g.strike} className={`card post token-card${sel.includes(g.strike) ? ' selected' : ''}${own ? ' selectable' : ''}`} onClick={own ? (e) => { if (!(e.target as Element).closest('a, input')) flip(g.strike); } : undefined}>
            <StrikeCard s={strikes[g.strike]} part={g.amount} sub={`${fmt(g.amount)} tokens`} extra={own && <input type="checkbox" checked={sel.includes(g.strike)} onChange={() => flip(g.strike)} aria-label={`Select Strike #${g.strike}`} />} />
          </article>
        ))}
      </div>
      {own && (
        <div className="origin-actions">
          <button className="btn btn-primary" disabled={!picked.length} onClick={() => setOpen(true)}>{picked.length ? `Seal ${picked.length} selected into a folio` : 'Select Strikes to seal'}</button>
          <span className="small muted">Up to 8 Strikes per folio.</span>
        </div>
      )}
      {open && (
        <Modal title="Seal into a folio" onClose={() => setOpen(false)}>
          <ul className="seal-list">{picked.map((g) => <li key={g.strike}><span>Strike #{g.strike}</span><span className="mono">{fmt(g.amount)}</span></li>)}</ul>
          <p className="small">Moves exactly these {fmt(tokens)} tokens into a new folio that only you control. Their rarity stays intact, and you can then list, gift or keep the folio. Creating it costs about 0.004 SOL of rent, returned when it is opened.</p>
          <button className="btn btn-primary wide" onClick={() => { seal(a.account, picked.map((g) => g.strike)); setSel([]); setOpen(false); }}>Seal {picked.length} Strike{picked.length === 1 ? '' : 's'}</button>
        </Modal>
      )}
    </div>
  );
}

function FolioCard({ f, own }: { f: Folio; own: boolean }) {
  const { list, cancel, gift, withdraw } = useStore();
  const [mode, setMode] = useState<'list' | 'gift' | 'withdraw' | null>(null);
  const [price, setPrice] = useState('');
  const [to, setTo] = useState('');
  const close = () => setMode(null);
  const p = Number(price);
  const preview = <div className="post buy-post"><FolioHead f={f} /><FolioBody f={f} showAddress={false} /></div>;
  return (
    <article className="card post wallet-env">
      <FolioHead f={f} />
      <FolioBody f={f} showAddress={false} />
      {own && (
        <div className="card-foot">
          {f.status === 'listed' ? <button className="btn btn-ghost" onClick={() => cancel(f.address)}>Cancel listing</button> : (
            <>
              <button className={(f.roll?.points || f.segments.length) ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => setMode('list')}>List on desk</button>
              <button className="btn btn-ghost" onClick={() => setMode('gift')}>Gift</button>
              <button className="btn btn-ghost danger-text" onClick={() => setMode('withdraw')}>Withdraw...</button>
            </>
          )}
        </div>
      )}
      {mode === 'list' && (
        <Modal title="List on the collector desk" onClose={close}>
          {preview}
          <label className="field-label">Price in SOL<input className="field" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="e.g. 1.5" autoFocus /></label>
          <dl className="post-details buy-terms">
            <dt>You get</dt><dd>{p > 0 ? <strong>{(p - (p * DESK_FEE_BPS) / 10_000).toFixed(4)} SOL</strong> : 'The price'}, after the {DESK_FEE_BPS / 100}% Tallymark desk fee</dd>
            <dt>How</dt><dd className="muted">The folio stays in the vault. A buyer pays and becomes the holder in one transaction.</dd>
          </dl>
          <button className="btn btn-primary wide" disabled={!(p > 0)} onClick={() => { list(f.address, +p.toFixed(3)); close(); }}>List for {price || '...'} SOL</button>
        </Modal>
      )}
      {mode === 'gift' && (
        <Modal title="Gift this folio" onClose={close}>
          {preview}
          <label className="field-label">Recipient wallet address<input className="field" value={to} onChange={(e) => setTo(e.target.value.trim())} placeholder="Solana address" autoFocus spellCheck={false} /></label>
          <p className="small muted">The recipient becomes the holder immediately. This cannot be undone.</p>
          {to && !isAddress(to) && <p className="error-note">Not a valid address.</p>}
          <ConfirmWord word="GIFT" danger={false} label={`Gift to ${to && isAddress(to) ? short(to) : '...'}`} onConfirm={() => { if (isAddress(to)) { gift(f.address, to); close(); } }} />
        </Modal>
      )}
      {mode === 'withdraw' && (
        <Modal title="Withdraw and melt" onClose={close}>
          <p className="melt-banner">Withdrawing sends the tokens back to your wallet as <strong>ordinary $TALLY</strong>. Their rarity is destroyed permanently. No one can ever restore it.</p>
          {preview}
          <ConfirmWord word="MELT" label="Withdraw and melt forever" onConfirm={() => { withdraw(f.address); close(); }} />
        </Modal>
      )}
    </article>
  );
}

function RollPanel({ folios, ordinary }: { folios: Folio[]; ordinary: number }) {
  const { roll, sealOrdinary } = useStore();
  const [amt, setAmt] = useState(String(ROLL_MIN));
  const [spinning, setSpinning] = useState<string | null>(null);
  const [result, setResult] = useState<{ f: string; name: string; points: number } | null>(null);
  const eligible = folios.filter((f) => !f.segments.length && f.common >= ROLL_MIN && f.status === 'sealed' && !(f.roll && f.roll.points > 0));
  const n = Math.floor(Number(amt.replace(/,/g, '')));
  const go = (f: Folio) => {
    setResult(null); setSpinning(f.address);
    setTimeout(() => { const r = roll(f.address); setSpinning(null); if (r) setResult({ f: f.address, ...r }); }, 1600);
  };
  return (
    <section className="panel tabbed">
      <div className="view-head"><p className="muted view-line">Seal at least {fmt(ROLL_MIN)} ordinary $TALLY into a folio, then pay {ROLL_FEE_SOL} SOL to roll it. The tier is decided by a Solana block produced after you roll. See the odds on <Link to="/rolls">Rolls</Link>.</p></div>
      <div className="roll-seal">
        <label className="field-label">Ordinary $TALLY to seal<input className="field" value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="numeric" /></label>
        <button className="btn btn-primary" disabled={!(n >= ROLL_MIN && n <= ordinary)} onClick={() => sealOrdinary(n)}>Seal into a new folio</button>
        <span className="small muted">You hold {fmt(ordinary)} ordinary.</span>
      </div>
      {result && (
        <div className={`roll-result t${band(result.points)}`}>
          <RollIcon points={result.points} name={result.name} />
          <div><strong>{result.points ? `You rolled ${result.name}` : 'Blank. Nothing this time.'}</strong>
            <span className="muted small">{result.points ? `${BANDS[band(result.points)]}, ${result.points} points. Folio ${short(result.f)} now carries it.` : 'This folio can roll again.'}</span></div>
        </div>
      )}
      {eligible.length ? (
        <div className="cards wallet-folios">
          {eligible.map((f) => (
            <article key={f.address} className="card post">
              <FolioHead f={f} />
              <dl className="post-details"><dt>Inside</dt><dd>{fmt(folioTokens(f))} ordinary $TALLY</dd>{f.roll && <><dt>Last roll</dt><dd className="muted">Blank</dd></>}</dl>
              <div className="roll-go">
                <RollIcon points={spinning === f.address ? 0 : null} spin={spinning === f.address} />
                <button className="btn btn-primary" disabled={!!spinning} onClick={() => go(f)}>{spinning === f.address ? 'Rolling...' : `Roll for ${ROLL_FEE_SOL} SOL`}</button>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="muted">No folio is ready to roll. Seal some ordinary $TALLY above first.</p>}
    </section>
  );
}

export default function Wallet() {
  const param = useParams().address ?? null;
  const w = useWallet();
  const { strikes, folios, mine } = useStore();
  const addr = param ?? w.address;
  const own = !!addr && addr === w.address;
  const [tab, setTab] = useState<'rare' | 'folios' | 'roll'>('rare');

  if (!addr) {
    return (
      <>
        <PageHead title="My wallet" sub="Connect your wallet to see and manage your rare $TALLY." />
        <Feature title="Connect your wallet" sub="See what you got: the rare tokens you bought on the curve and your folios. Then seal, list, gift or roll.">
          <button className="btn btn-primary btn-cycle" onClick={w.connect}>Connect wallet</button>
        </Feature>
        <section className="panel wallet-verify">
          <h2>Where rarity lives</h2>
          <ul className="checks">
            <li className="ok"><span className="check-mark">✓</span><span>Tokens bought off the curve stay rare in the token account that bought them.</span></li>
            <li className="ok"><span className="check-mark">✓</span><span>Sealed in a folio, they can be listed, sold or gifted without melting.</span></li>
            <li className="bad"><span className="check-mark">✗</span><span>Sold, sent, or withdrawn from a folio, they melt into ordinary $TALLY for good.</span></li>
          </ul>
          <p className="small muted">Have an address? Paste it after <span className="mono">#/wallet/</span> to view any wallet.</p>
        </section>
      </>
    );
  }
  if (!isAddress(addr)) return <div className="panel"><p className="error-note">That doesn't look like a Solana address.</p></div>;

  let accounts: Acct[];
  if (own && mine) accounts = mine.accounts;
  else {
    const m = new Map<string, Segment[]>();
    for (const s of strikes) for (const p of s.pieces) if (p.holder === addr && !p.folio) m.set(p.account, [...(m.get(p.account) ?? []), { strike: s.n, amount: p.amount }]);
    accounts = [...m].map(([account, segments]) => ({ account, segments }));
  }
  const myFolios = folios.filter((f) => f.holder === addr);
  const count = accounts.reduce((a, x) => a + x.segments.length, 0);
  const rare = accounts.reduce((a, x) => a + x.segments.reduce((b, s) => b + s.amount, 0), 0);
  const tabs = (own ? ['rare', 'folios', 'roll'] : ['rare', 'folios']) as ('rare' | 'folios' | 'roll')[];

  return (
    <>
      <PageHead title={own ? 'My wallet' : 'Wallet'} sub={<><Addr value={addr} />{own ? ' is currently connected.' : ', viewing only, not connected.'} Rare tokens from the curve and sealed folios.</>}>
        <StatBox items={[...(own && mine ? [[fmt(mine.ordinary), 'Ordinary $TALLY'] as [string, string]] : []), [fmt(rare), 'Rare tokens'], [String(myFolios.length), 'Folios']]} />
      </PageHead>
      <div className="tabs" role="tablist" aria-label="Wallet">
        {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' on' : ''}${t === 'roll' ? ' tab-roll' : ''}`} onClick={() => setTab(t)}>{t === 'rare' ? `Rare tokens (${count})` : t === 'folios' ? `Folios (${myFolios.length})` : 'Roll'}</button>)}
      </div>
      {tab === 'rare' && (
        <section className="panel tabbed">
          <div className="view-head"><p className="muted view-line">Rare tokens stay rare while they stay in the account that bought them.{own ? ' Select Strikes to seal them into a folio.' : ''}</p></div>
          {accounts.length ? accounts.map((a) => <Origin key={a.account} a={a} own={own} />) : (
            <p className="muted">{own ? 'You hold no rare $TALLY outside folios. ' : 'No rare $TALLY here. '}Rarity only exists in the account that bought it off the curve. Tokens bought after the curve or received from others are ordinary.</p>
          )}
          {!own && accounts.length > 0 && <p className="small muted" style={{ marginTop: 16 }}>Each full Strike is {fmt(STRIKE_SIZE)} tokens. <Link to="/strikes">Browse all Strikes</Link></p>}
        </section>
      )}
      {tab === 'folios' && (
        <section className="panel tabbed">
          <div className="view-head"><p className="muted view-line">Sealed tokens that can be listed, gifted or rolled without melting.</p></div>
          {myFolios.length ? <div className="cards wallet-folios">{myFolios.map((f) => <FolioCard key={f.address} f={f} own={own} />)}</div>
            : <p className="muted">{own ? 'Seal rare tokens into a folio to sell or gift them without melting.' : 'No folios.'}</p>}
        </section>
      )}
      {tab === 'roll' && own && mine && <RollPanel folios={myFolios} ordinary={mine.ordinary} />}
    </>
  );
}
