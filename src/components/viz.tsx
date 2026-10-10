import { useNavigate } from 'react-router-dom';
import { BANDS, Strike, band, fmt } from '../lib/ledger';

export const tipFor = (s: Strike) =>
  `Strike #${s.n}|${BANDS[band(s.rank)]} · ${s.traits.join(', ')} · ${s.issued === 0 ? 'not yet issued' : `${fmt(s.surviving)} of ${fmt(s.issued)} surviving`}`;
export const tierOf = (s: Strike) => (s.issued === 0 ? 'u' : s.surviving === 0 ? 'm' : String(band(s.rank)));
export const focusKey = (s: Strike) => (s.issued === 0 ? 'unissued' : s.surviving === 0 ? 'melted' : `t${band(s.rank)}`);

/** Every Strike as one block, numbered 0 to 793. */
export function Sheet({ strikes }: { strikes: Strike[] }) {
  const nav = useNavigate();
  return (
    <div className="sheet" role="list">
      {strikes.map((s) => {
        const f = s.issued ? s.surviving / s.issued : 0;
        return (
          <a key={s.n} role="listitem" href={`#/strike/${s.n}`} onClick={(e) => { e.preventDefault(); nav(`/strike/${s.n}`); }}
            className={`cell t${band(s.rank)} ${s.issued === 0 ? 'unissued' : s.surviving === 0 ? 'melted' : 'live'}`}
            style={{ ['--f' as string]: f }} data-tip={tipFor(s)} data-tier={tierOf(s)} data-k={focusKey(s)} aria-label={tipFor(s).replace('|', ', ')} />
        );
      })}
    </div>
  );
}

const sumTip = (l: Strike[]) => {
  const surv = l.reduce((a, s) => a + s.surviving, 0), iss = l.reduce((a, s) => a + s.issued, 0);
  const best = l.reduce((a, s) => Math.max(a, s.rank), 0);
  return { tip: `Strikes #${l[0].n} to #${l[l.length - 1].n}|best ${BANDS[band(best)]} · ${iss ? `${((surv / iss) * 100).toFixed(1)}% surviving` : 'not yet issued'}`, tier: iss ? (surv ? String(band(best)) : 'm') : 'u' };
};

/** The Strikes stacked along the bonding curve, in buying order. Each column is a few Strikes. */
export function Curve({ strikes, width, height = 440 }: { strikes: Strike[]; width: number; height?: number }) {
  const cell = 10, gap = 2, step = cell + gap;
  const W = Math.max(300, Math.round(width)), H = height, base = H - 26;
  const cols = Math.floor(W / step);
  const maxRows = Math.floor((base - 30) / step);
  const per = strikes.length / cols;
  const out: JSX.Element[] = [];
  for (let c = 0; c < cols; c++) {
    const l = strikes.slice(Math.floor(c * per), Math.max(Math.floor((c + 1) * per), Math.floor(c * per) + 1));
    const rows = Math.max(1, Math.round(maxRows * (c / (cols - 1)) ** 2.4) + 1);
    const live = l.filter((s) => s.issued > 0 && s.surviving > 0);
    const w = [0, 0, 0, 0];
    live.forEach((s) => (w[band(s.rank)] += s.surviving / s.issued));
    const cells: number[] = [];
    if (live.length) {
      const scale = rows / l.length;
      const n = w.map((v, b) => (b > 0 && v > 0 ? Math.max(1, Math.round(v * scale)) : Math.round(v * scale)));
      let over = n.reduce((a, v) => a + v, 0) - rows;
      for (let b = 0; b < 4 && over > 0; b++) { const d = Math.min(over, b === 0 ? n[0] : Math.max(0, n[b] - 1)); n[b] -= d; over -= d; }
      [3, 2, 1, 0].forEach((b) => { for (let i = 0; i < n[b]; i++) cells.push(b); });
      cells.reverse();
    }
    const { tip, tier } = sumTip(l);
    const keys = live.length ? '' : l.some((s) => s.issued) ? 'melted' : 'unissued';
    for (let rI = 0; rI < rows; rI++) {
      const b = cells[rI];
      out.push(<rect key={`${c},${rI}`} className={b === undefined ? (live.length || l.some((s) => s.issued) ? 'lab-gone' : 'lab-future') : `lab-t${b}`}
        data-k={b === undefined ? keys || 'melted' : `t${b}`} x={c * step} y={base - (rI + 1) * step} width={cell} height={cell} data-tip={tip} data-tier={b === undefined ? (keys === 'unissued' ? 'u' : 'm') : tier} />);
    }
  }
  const g = (x: number) => base - (maxRows * (x / (cols - 1)) ** 2.4 + 1) * step - step * 1.4;
  const d = Array.from({ length: 61 }, (_, i) => { const x = (i / 60) * (cols - 1); return `${i ? 'L' : 'M'}${(x * step + cell / 2).toFixed(1)} ${g(x).toFixed(1)}`; }).join(' ');
  const ex = (cols - 1) * step + cell / 2, ey = g(cols - 1), ang = Math.atan2(ey - g(cols - 2), step);
  const head = [0.5, -0.5].map((o) => `${ex - 7 * Math.cos(ang + o)},${ey - 7 * Math.sin(ang + o)}`).join(' ');
  return (
    <svg className="lab-svg" viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges">
      {out}
      <path className="lab-arrow" d={d} shapeRendering="geometricPrecision" />
      <polygon className="lab-arrowhead" points={`${ex},${ey} ${head}`} shapeRendering="geometricPrecision" />
      <text x={0} y={base + 22}>STRIKE 0</text>
      <text x={W} y={base + 22} textAnchor="end">STRIKE {strikes.length - 1}</text>
    </svg>
  );
}

const RGB: Record<string, number[]> = { t0: [20, 241, 149], t1: [79, 134, 247], t2: [153, 69, 255], t3: [17, 17, 17], melted: [220, 220, 220], unissued: [244, 244, 244] };
const WEIGHT: Record<string, number> = { t0: 1, t1: 3, t2: 6, t3: 10, melted: 1, unissued: 1 };

/** The same Strikes blended into one gradient, in buying order. */
export function Gradient({ strikes, focus }: { strikes: Strike[]; focus: string | null }) {
  const n = strikes.length;
  const slice = (i: number, of: number) => strikes.slice(Math.floor((i * n) / of), Math.max(Math.floor(((i + 1) * n) / of), Math.floor((i * n) / of) + 1));
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  const dens = focus ? Array.from({ length: 160 }, (_, i) => { const l = slice(i, 160); return l.filter((s) => focusKey(s) === focus).length / l.length; }) : [];
  const top = Math.max(1e-9, ...dens);
  const stops = Array.from({ length: 160 }, (_, i) => {
    let c: number[];
    if (focus) { const k = dens[i] > 0 ? 0.6 + 0.4 * (dens[i] / top) : 0; c = RGB[focus].map((v) => 255 + (v - 255) * k); }
    else {
      let r = 0, g = 0, b = 0, w = 0;
      for (const s of slice(i, 160)) { const k = focusKey(s), x = RGB[k], ww = WEIGHT[k]; r += x[0] * ww; g += x[1] * ww; b += x[2] * ww; w += ww; }
      c = [r / w, g / w, b / w];
    }
    return { at: (i / 159) * 100, colour: `#${c.map(hex).join('')}` };
  });
  const hits = Array.from({ length: 40 }, (_, i) => ({ x: (i / 40) * 1200, ...sumTip(slice(i, 40)) }));
  const last = n - 1;
  return (
    <div className="gradient-wrap">
      <svg className="lab-svg gradient-view" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <defs><linearGradient id="strike-gradient" x1="0" x2="1" y1="0" y2="0">{stops.map((s) => <stop key={s.at} offset={`${s.at}%`} stopColor={s.colour} />)}</linearGradient></defs>
        <rect x={0} y={0} width={1200} height={200} fill="url(#strike-gradient)" />
        {hits.map((h) => <rect key={h.x} className="grad-hit" x={h.x} y={0} width={30} height={200} data-tip={h.tip} data-tier={h.tier} />)}
      </svg>
      <div className="grad-ruler" aria-hidden>
        {[0, 100, 200, 300, 400, 500, 600, 700, last].map((v) => <span key={v} style={{ left: `${(v / last) * 100}%` }}>{v === 0 ? 'Strike 0' : v}</span>)}
      </div>
    </div>
  );
}
