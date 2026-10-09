import { useState } from 'react';
import { PageHead } from '../components/ui';

const TERMS: [string, string][] = [
  ['Strike', 'One numbered record on the ledger, worth 1,000,000 tokens bought off the curve.'],
  ['Curve', 'The bonding curve the token sells on before it moves to an open pool.'],
  ['Era', 'A range of Strike numbers. Earlier eras hold fewer Strikes.'],
  ['Tier', 'The rarity drawn for a Strike after the sale: Plain, Marked, Double or Crossed.'],
  ['Roll', 'The public draw that assigns tiers, seeded by a block hash fixed in advance.'],
  ['Melt', 'What happens to a Strike when part of its million leaves the wallet.'],
  ['Standing', 'How much of a Strike is still held, from 0% to 100%.'],
  ['Holder', 'The wallet that bought a Strike and still holds it.'],
  ['Desk', 'The page where holders list whole Strikes for other wallets.'],
  ['Ledger', 'The full ordered list of every Strike and its state.'],
  ['Slot', 'The Solana slot the buy that cut a Strike landed in.'],
  ['Block hash', 'A value from a finished block. Nobody can choose it ahead of time, which is why the roll uses it.'],
  ['Preview', 'Demo data shown until the token launches. Same shape as the real ledger.'],
  ['Crossed', 'The rarest tier. The fifth stroke that closes a tally.'],
];

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = TERMS.filter(([t, d]) => (t + ' ' + d).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a[0].localeCompare(b[0]));
  const letters = [...new Set(list.map(([t]) => t[0].toUpperCase()))];
  return (
    <>
      <PageHead title="Glossary" sub="Every word the ledger uses, in one place." />
      <div className="search-row"><input className="field" placeholder="Search terms" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {letters.map((L) => (
        <div key={L}>
          <div className="glossary-letter">{L}</div>
          <dl>{list.filter(([t]) => t[0].toUpperCase() === L).map(([t, d]) => <div className="glossary-row" key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
        </div>
      ))}
      {!list.length && <div className="panel muted">No term matches.</div>}
    </>
  );
}
