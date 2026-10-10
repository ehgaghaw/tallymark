import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BANDS, band, fmt, short } from '../lib/ledger';
import { useStore } from '../lib/store';
import { PageHead, RollIcon, TallyIcon } from '../components/ui';

type Row = { key: string; kind: 'strike' | 'roll'; text: React.ReactNode; icon: React.ReactNode; slot: number };

// Replays the preview ledger as a live feed, one entry every couple of seconds.
export default function Live() {
  const { strikes, feed } = useStore();
  const all: Row[] = [];
  strikes.forEach((s) => s.history.forEach((h, i) => all.push({ key: `s${s.n}-${i}`, kind: 'strike', slot: h.slot, icon: <TallyIcon rank={s.rank} part={s.surviving} whole={s.issued} />, text: <><Link to={`/strike/${s.n}`}><b>Strike #{s.n}</b></Link> <span className="muted">{BANDS[band(s.rank)]}</span> &middot; {h.text}</> })));
  feed.forEach((e, i) => all.push({ key: `r${i}`, kind: 'roll', slot: e.slot, icon: <RollIcon points={e.points} name={e.name} />, text: <><Link to={`/wallet/${e.holder}`}>{short(e.holder)}</Link> rolled <b>{e.name}</b></> }));
  all.sort((a, b) => a.slot - b.slot);
  const [i, setI] = useState(40);
  useEffect(() => { const id = setInterval(() => setI((x) => (x >= all.length ? 40 : x + 1)), 1800); return () => clearInterval(id); }, [all.length]);
  const rows = all.slice(Math.max(0, i - 40), i).reverse();
  return (
    <>
      <PageHead title="Live" sub="Every buy, melt, seal, sale and roll as it lands, newest first. In preview this replays the demo ledger." >
        <span className="u small nav-live"><i />Streaming</span>
      </PageHead>
      <section className="panel">
        <ul className="feed">
          {rows.map((r, k) => (
            <li key={r.key} className={k === 0 ? 'feed-new' : ''}>
              <span className="feed-icon">{r.icon}</span>
              <span className="feed-text">{r.text}</span>
              <span className="feed-link mono small muted">slot {fmt(r.slot)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
