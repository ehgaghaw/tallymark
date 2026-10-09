import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LISTINGS, TIERS, strike, short, ago } from '../lib/ledger';
import { PageHead } from '../components/ui';
import { useWallet } from '../lib/wallet';

export default function Desk() {
  const nav = useNavigate();
  const { address, connect } = useWallet();
  const [toast, setToast] = useState('');
  const buy = (n: number) => {
    if (!address) { connect(); return; }
    setToast(`Desk opens at launch. Strike #${n} is preview data.`);
    setTimeout(() => setToast(''), 2600);
  };
  return (
    <>
      <PageHead title="Desk" sub="Whole Strikes listed by their holders. A Desk trade moves the million and the mark together." />
      <div className="table-scroll"><table className="table">
        <thead><tr><th>Strike</th><th>Tier</th><th>Era</th><th>Seller</th><th className="num">Ask</th><th className="num">Listed</th><th /></tr></thead>
        <tbody>{LISTINGS.map((l) => {
          const s = strike(l.n)!;
          return (
            <tr key={l.n} className={`link t${s.tier}`} onClick={() => nav(`/strike/${l.n}`)}>
              <td><b>#{l.n}</b></td><td><i className="tier-dot" />{TIERS[s.tier].name}</td><td className="muted">{s.era}</td>
              <td>{short(l.seller)}</td><td className="num">{l.askSol} SOL</td><td className="num muted">{ago(l.postedAt)}</td>
              <td className="num"><button className="btn" onClick={(e) => { e.stopPropagation(); buy(l.n); }}>Buy</button></td>
            </tr>
          );
        })}</tbody>
      </table></div>
      {toast && <div className="toast small">{toast}</div>}
    </>
  );
}
