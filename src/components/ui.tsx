import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BANDS, Folio, Strike, band, folioRank, fmt, isFlaw, pct, short, traitCount, traitPoints, STRIKE_COUNT, STRIKES, rollPoints } from '../lib/ledger';

// five-bar tally glyph on a 7x5 grid: four uprights and the stroke across them
const GLYPH: [number, number][] = [];
for (const x of [0, 2, 4, 6]) for (let y = 0; y < 5; y++) GLYPH.push([x, y]);
for (const x of [1, 3, 5]) GLYPH.push([x, 4 - Math.round((x / 6) * 4)]);
const GLYPH_SORTED = [...GLYPH].sort((a, b) => b[1] - a[1] || a[0] - b[0]);

/** Pixel tally mark coloured by rarity; lit pixels show how much of the Strike survives. */
export function TallyIcon({ rank, part = 1, whole = 1, size = 'md' }: { rank: number; part?: number; whole?: number; size?: 'md' | 'lg' }) {
  const lit = whole ? Math.ceil((part / whole) * GLYPH_SORTED.length) : 0;
  return (
    <span className={`tally-icon ${size} t${band(rank)}${part === 0 ? ' gone' : ''}`} aria-hidden>
      <svg viewBox="-0.5 -0.5 8 6" shapeRendering="crispEdges">
        {GLYPH_SORTED.map(([x, y], i) => <rect key={i} x={x + 0.07} y={y + 0.07} width={0.86} height={0.86} className={i < lit ? 'on' : 'off'} />)}
      </svg>
    </span>
  );
}

export function RollIcon({ name, points, spin }: { name?: string; points: number | null; spin?: boolean }) {
  const b = points === null ? 'blank' : `t${band(points)}`;
  return (
    <span className={`roll-coin ${b}${spin ? ' spin' : ''}`} aria-hidden title={name}>
      <svg viewBox="-0.5 -0.5 8 6" shapeRendering="crispEdges">{GLYPH.map(([x, y], i) => <rect key={i} x={x + 0.07} y={y + 0.07} width={0.86} height={0.86} />)}</svg>
    </span>
  );
}

export function TraitChips({ traits, showShare }: { traits: string[]; showShare?: boolean }) {
  return (
    <ul className="trait-chips">
      {traits.map((t) => {
        const p = traitPoints(t) || rollPoints(t);
        const n = traitCount(t);
        return (
          <li key={t} className={`chip t${band(p)}`}>
            <i className="tier-dot" />{t}
            <span className="muted">{isFlaw(t) ? 'Flaw' : n ? 'Position' : 'Rolled'}{p ? ` · ${p} pts` : ''}{showShare && n ? ` · ${((n / STRIKE_COUNT) * 100).toFixed(n < 8 ? 2 : 1)}% of Strikes` : ''}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function RarityTag({ rank }: { rank: number }) {
  const b = band(rank);
  return <span className="rarity-tag"><i className={`tier-dot t${b}`} />{BANDS[b]}</span>;
}

export function StrikeCard({ s, part, sub, extra }: { s: Strike; part?: number; sub?: string; extra?: React.ReactNode }) {
  const p = part ?? s.surviving;
  return (
    <>
      <header className="post-head">
        <TallyIcon rank={s.rank} part={p} whole={part !== undefined ? s.size : s.issued} />
        <span className="post-who">
          <Link to={`/strike/${s.n}`} className="strike-title">Strike #{s.n}</Link>
          <span className="small muted">{sub ?? (s.issued ? `${pct(s.surviving, s.issued)}% surviving` : 'Not yet bought')}</span>
        </span>
        <RarityTag rank={s.rank} />
        {extra}
      </header>
      <TraitChips traits={s.traits} />
    </>
  );
}

export type Opt<T> = { value: T; label: string; mark?: React.ReactNode; note?: string; heading?: string };
export function FilterMenu<T extends string | number>({ label, options, chosen, onToggle }: { label: string; options: Opt<T>[]; chosen: T[]; onToggle: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  return (
    <div className="filter-menu" ref={ref}>
      <button type="button" className={`filter-btn${chosen.length ? ' on' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        {label}{chosen.length > 0 && <span className="filter-count">{chosen.length}</span>}
        <svg className="filter-caret" viewBox="0 0 10 6" aria-hidden><path d="M1 1l4 4 4-4" /></svg>
      </button>
      {open && (
        <div className="filter-list" role="menu">
          {options.map((o, i) => (
            <React.Fragment key={String(o.value)}>
              {o.heading && <span className={`filter-heading${i ? ' filter-sep' : ''}`}>{o.heading}</span>}
              <label className="filter-option">
                <input type="checkbox" checked={chosen.includes(o.value)} onChange={() => onToggle(o.value)} />
                {o.mark}<span className="filter-label">{o.label}</span>{o.note && <span className="filter-note">{o.note}</span>}
              </label>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
export const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function Legend({ focus, onFocus, onPin, shares, extra = true }: { focus?: string | null; onFocus?: (k: string | null) => void; onPin?: (k: string) => void; shares?: string[]; extra?: [string, string][] | boolean }) {
  const item = (key: string, sw: string, label: string, sh?: string) => (
    <button type="button" key={key} className={`key-item${focus === key ? ' on' : ''}`} onMouseEnter={() => onFocus?.(key)} onMouseLeave={() => onFocus?.(null)} onClick={() => onPin?.(key)} aria-pressed={focus === key}>
      <i className={`swatch ${sw}`} />{label}{sh && <span className="key-share">{sh}</span>}
    </button>
  );
  const ex: [string, string][] = extra === true ? [['melted', 'Melted'], ['unissued', 'Not yet issued']] : extra || [];
  return (
    <div className="legend small key-interactive">
      <span className="key-hint">Filter</span>
      {BANDS.map((b, i) => item(`t${i}`, `t${i}`, b, shares?.[i]))}
      {ex.map(([k, l]) => item(k, `${k}-swatch`, l))}
    </div>
  );
}

export function StatBox({ items }: { items: [string, string][] }) {
  return <div className="roll-stat-box">{items.map(([v, l]) => <div key={l}><strong>{v}</strong><span className="muted">{l}</span></div>)}</div>;
}

export function PageHead({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted page-sub">{sub}</p>}</div>{children}</div>;
}

export function Pager({ page, pages, set }: { page: number; pages: number; set: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pages">
      <button type="button" disabled={page === 0} onClick={() => set(page - 1)}>&larr; Previous</button>
      <span className="pager-pages">{Array.from({ length: pages }, (_, i) => <button type="button" key={i} className={i === page ? 'on' : ''} onClick={() => set(i)}>{i + 1}</button>)}</span>
      <button type="button" disabled={page === pages - 1} onClick={() => set(page + 1)}>Next &rarr;</button>
    </nav>
  );
}

export function Addr({ value, href }: { value: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }).catch(() => {}); };
  return (
    <span className="addr mono">
      {href ? <Link to={href}>{short(value)}</Link> : short(value)}
      <button type="button" className="copy" onClick={copy} aria-label="Copy address">{copied ? 'copied' : 'copy'}</button>
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button className="modal-x" onClick={onClose} aria-label="Close">&times;</button></div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmWord({ word, label, danger = true, onConfirm }: { word: string; label: string; danger?: boolean; onConfirm: () => void }) {
  const [v, setV] = useState('');
  return (
    <div className="confirm-word">
      <label className="field-label">Type <b>{word}</b> to confirm<input className="field" value={v} onChange={(e) => setV(e.target.value)} autoFocus spellCheck={false} /></label>
      <button className={`btn wide ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={v.trim().toUpperCase() !== word} onClick={onConfirm}>{label}</button>
    </div>
  );
}

const FOLIO_PIX: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [1, 1], [5, 1], [2, 2], [4, 2], [3, 3], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5]];
export function FolioAvatar({ f }: { f: Folio }) {
  const r = folioRank(f);
  return (
    <svg className={`avatar ${r < 0 ? 'avatar-empty' : `t${band(r)}`}`} viewBox="-1 -1 9 8" aria-hidden shapeRendering="crispEdges">
      {FOLIO_PIX.map(([x, y]) => <rect key={`${x},${y}`} x={x + 0.08} y={y + 0.08} width={0.84} height={0.84} />)}
    </svg>
  );
}

export function FolioHead({ f, seller }: { f: Folio; seller?: boolean }) {
  return (
    <header className="post-head">
      <FolioAvatar f={f} />
      <span className="post-who">
        {seller ? <Addr value={f.holder} href={`/wallet/${f.holder}`} /> : <strong>Folio {short(f.address)}</strong>}
        <span className="small muted">{seller ? 'Seller' : f.status === 'listed' ? 'Listed on the desk' : 'Sealed'}</span>
      </span>
      {f.status === 'listed' && f.price !== undefined && <span className="price">{f.price} <small>SOL</small></span>}
    </header>
  );
}

export function FolioBody({ f, showAddress = true }: { f: Folio; showAddress?: boolean }) {
  return (
    <>
      <dl className="post-details">
        {showAddress && <><dt>Folio</dt><dd className="mono">{short(f.address)}</dd></>}
        {f.roll && <><dt>Rolled</dt><dd><span className="rolled"><RollIcon points={f.roll.points} name={f.roll.name} /><b>{f.roll.name}</b>{f.roll.points > 0 && <span className="muted"> &middot; {BANDS[band(f.roll.points)]}, {f.roll.points} pts</span>}</span></dd></>}
        {!f.segments.length && <><dt>Inside</dt><dd className="muted">{f.roll && f.roll.points > 0 ? 'Ordinary $TALLY carrying a rolled tier.' : 'No rare Strikes: the contents are ordinary $TALLY.'}</dd></>}
        {f.common > 0 && <><dt>Also</dt><dd>{fmt(f.common)} ordinary $TALLY</dd></>}
      </dl>
      {f.segments.length > 0 && (
        <div className="env-strikes">
          {f.segments.map((g) => <div className="strike-mini" key={g.strike}><StrikeCard s={STRIKES[g.strike]} part={g.amount} sub={`${fmt(g.amount)} tokens`} /></div>)}
        </div>
      )}
    </>
  );
}

export function Feature({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="feature-frame">
      <div className="feature-inner">
        <div className="panel-head panel-head-stack"><h2>{title}</h2><p className="muted list-sub">{sub}</p></div>
        {children}
      </div>
    </section>
  );
}

export type Tip = { text: string; tier: string; x: number; y: number };
export function HoverTip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  const [a, b] = tip.text.split('|');
  return <div className="hover-tip" style={{ left: tip.x + 14, top: tip.y + 14 }} aria-hidden><i className={`tip-swatch tip-${tip.tier}`} /><span className="tip-body"><strong>{a}</strong><span>{b}</span></span></div>;
}
export function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const onMove = (e: React.MouseEvent) => {
    const t = (e.target as Element).closest('[data-tip]');
    setTip(t ? { text: t.getAttribute('data-tip')!, tier: t.getAttribute('data-tier') ?? '', x: e.clientX, y: e.clientY } : null);
  };
  return { tip, onMove, clear: () => setTip(null) };
}
