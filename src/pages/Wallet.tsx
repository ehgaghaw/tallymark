import { STRIKES, STRIKE_SIZE, fmt, short } from '../lib/ledger';
import { PageHead, StatsRow, StrikeCard } from '../components/ui';
import { useWallet } from '../lib/wallet';

export default function Wallet() {
  const { address, connect, disconnect } = useWallet();
  if (!address) {
    return (
      <>
        <PageHead title="My wallet" sub="Connect a Solana wallet to see the Strikes it holds and how much of each is still standing." />
        <div className="panel"><button className="btn btn-primary" onClick={connect}>Connect wallet</button></div>
      </>
    );
  }
  // Preview: map the connected wallet onto a stable slice of the demo ledger.
  const h = [...address].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const mine = STRIKES.filter((s) => (s.n * 2654435761 + h) % 97 === 0);
  const held = mine.reduce((a, s) => a + s.surviving, 0);
  return (
    <>
      <PageHead title="My wallet" sub={<>Connected as <b>{short(address, 6)}</b>. Preview data until launch.</>}>
        <button className="btn" onClick={disconnect}>Disconnect</button>
      </PageHead>
      <StatsRow items={[
        { label: 'Strikes', value: fmt(mine.length) },
        { label: 'Tokens standing', value: fmt(held) },
        { label: 'Intact', value: fmt(mine.filter((s) => s.surviving === STRIKE_SIZE).length) },
        { label: 'Best tier', value: ['Plain', 'Marked', 'Double', 'Crossed'][Math.max(0, ...mine.map((s) => s.tier))] },
      ]} />
      {mine.length ? <div className="cards">{mine.map((s) => <StrikeCard key={s.n} s={s} />)}</div> : <div className="panel muted">No Strikes in this wallet.</div>}
    </>
  );
}
