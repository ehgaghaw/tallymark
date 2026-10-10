// Tallymark preview ledger. Until $TALLY launches the site runs on deterministic demo data with the
// real shape: every 1,000,000 tokens bought off the bonding curve is a numbered Strike (#0 to #793).
// A Strike carries a Position trait (from its number) and maybe a Flaw (drawn after the sale).
// Their points add up to its rank, and the rank sets its rarity band.

export const TOKEN = '$TALLY';
export const STRIKE_SIZE = 1_000_000;
export const STRIKE_COUNT = 794;
export const LAST_SIZE = 100_000; // #793 is the short last Strike
export const PREVIEW = true;
export const REVEALED = true;
export const DESK_FEE_BPS = 150;
export const ROLL_FEE_SOL = 0.01;
export const ROLL_MIN = 50_000;

export const BANDS = ['Common', 'Uncommon', 'Rare', 'Legendary'] as const;
export type Band = 0 | 1 | 2 | 3;
export const band = (points: number): Band => (points <= 0 ? 0 : points < 30 ? 1 : points < 70 ? 2 : 3);

export const POSITIONS = [
  { name: 'First Light', from: 0, to: 4, points: 40, blurb: 'The first five Strikes bought. The opening marks on the wall.' },
  { name: 'Early Hours', from: 5, to: 24, points: 15, blurb: 'The next twenty, bought before most people knew the count had started.' },
  { name: 'Last Call', from: 793, to: 793, points: 10, blurb: 'The short final Strike that closes the curve.' },
];
export const DEFAULT_POSITION = { name: 'Open Count', points: 0, blurb: 'Every other Strike. Bought in the long middle of the sale.' };
export const FLAWS = [
  { name: 'Double Stroke', count: 3, points: 100, blurb: 'The pen went over the same line twice. Every mark after it reads double.' },
  { name: 'Ink Blot', count: 6, points: 70, blurb: 'A drop of ink landed on the page and swallowed the mark.' },
  { name: 'Skipped Line', count: 12, points: 50, blurb: 'The counter jumped a line, so the mark sits where no mark should be.' },
  { name: 'Torn Corner', count: 24, points: 30, blurb: 'The page tore at the edge and took part of the mark with it.' },
  { name: 'Smudge', count: 48, points: 15, blurb: 'A thumb dragged across wet ink and left a grey trail.' },
];
export const TRAIT_NAMES = [...POSITIONS.map((p) => p.name), DEFAULT_POSITION.name, ...FLAWS.map((f) => f.name)];
export const traitCount = (t: string) => {
  const p = POSITIONS.find((x) => x.name === t); if (p) return p.to - p.from + 1;
  if (t === DEFAULT_POSITION.name) return STRIKE_COUNT - 26;
  return FLAWS.find((f) => f.name === t)?.count ?? 0;
};
export const traitPoints = (t: string) => POSITIONS.find((x) => x.name === t)?.points ?? FLAWS.find((f) => f.name === t)?.points ?? 0;
export const isFlaw = (t: string) => FLAWS.some((f) => f.name === t);

// Roll tiers, odds out of 1,000,000
export const ROLL_TIERS = [
  { name: 'Grand Total', points: 100, odds: 500, blurb: 'The sum at the foot of the last page.' },
  { name: 'Closing Line', points: 85, odds: 1_000, blurb: 'The double rule drawn under a finished count.' },
  { name: 'Full Page', points: 70, odds: 2_000, blurb: 'A page with no room left for one more mark.' },
  { name: 'Five-Bar Gate', points: 55, odds: 4_000, blurb: 'Four strokes and the one across them.' },
  { name: 'Carry Over', points: 45, odds: 6_000, blurb: 'The total brought forward to a new page.' },
  { name: 'Cross-Check', points: 30, odds: 10_000, blurb: 'A count done twice to be sure.' },
  { name: 'Running Total', points: 25, odds: 15_000, blurb: 'The sum so far, kept in the margin.' },
  { name: 'Hashmark', points: 20, odds: 20_000, blurb: 'A short line that marks a place.' },
  { name: 'Notch', points: 15, odds: 30_000, blurb: 'A cut in a stick. The oldest way to count.' },
  { name: 'Tick', points: 10, odds: 40_000, blurb: 'A small mark that says counted.' },
];
export const ROLL_BLANK = { name: 'Blank', points: 0, odds: 1_000_000 - ROLL_TIERS.reduce((a, t) => a + t.odds, 0), blurb: 'Nothing this time. A Blank folio can roll again.' };
export const ALL_ROLL = [...ROLL_TIERS, ROLL_BLANK];
export const rollPoints = (name: string) => ALL_ROLL.find((t) => t.name === name)?.points ?? 0;
export const pctOdds = (o: number) => { const p = o / 10_000; return p < 1 ? `${p.toFixed(2)}%` : `${+p.toFixed(1)}%`; };

// ---- seeded randomness so the preview is stable between reloads
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const addr = (r: () => number) => Array.from({ length: 44 }, () => B58[Math.floor(r() * 58)]).join('');
export const sig = (r: () => number) => Array.from({ length: 88 }, () => B58[Math.floor(r() * 58)]).join('');

// ---- types
export type Piece = { account: string; holder: string; folio?: string; amount: number };
export type Event = { kind: 'issue' | 'melt' | 'seal' | 'list' | 'sale' | 'gift' | 'unseal'; text: string; slot: number; at: number; sig: string };
export type Strike = {
  n: number; size: number; issued: number; surviving: number;
  position: string; flaw?: string; traits: string[]; rank: number;
  buyer: string; pieces: Piece[]; history: Event[]; boughtAt: number; slot: number;
};
export type Segment = { strike: number; amount: number };
export type Folio = {
  address: string; holder: string; status: 'sealed' | 'listed'; price?: number;
  segments: Segment[]; common: number; roll?: { name: string; points: number }; createdAt: number;
};
export type RollEvent = { holder: string; name: string; points: number; slot: number; at: number; sig: string };

const r = rng(20261009);
export const WALLETS = Array.from({ length: 180 }, () => addr(r));
const pick = () => WALLETS[Math.floor(r() ** 1.5 * WALLETS.length)];
export const SALE_START = Date.UTC(2026, 9, 8, 16, 0) / 1000;
const SLOT0 = 412_000_000;

// flaws: a fixed shuffle stands in for the public seed block
const order = Array.from({ length: STRIKE_COUNT }, (_, i) => i);
for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
const flawOf = new Map<number, string>();
let k = 0;
for (const f of FLAWS) for (let c = 0; c < f.count; c++) flawOf.set(order[k++], f.name);

export const FOLIOS: Folio[] = [];
const folioFor = new Map<string, Folio>();

export const STRIKES: Strike[] = Array.from({ length: STRIKE_COUNT }, (_, n) => {
  const size = n === STRIKE_COUNT - 1 ? LAST_SIZE : STRIKE_SIZE;
  const pos = POSITIONS.find((p) => n >= p.from && n <= p.to) ?? DEFAULT_POSITION;
  const flaw = REVEALED ? flawOf.get(n) : undefined;
  const traits = [pos.name, ...(flaw ? [flaw] : [])];
  const rank = pos.points + (flaw ? traitPoints(flaw) : 0);
  const buyer = pick();
  const boughtAt = SALE_START + n * 52 + Math.floor(r() * 40);
  const slot = SLOT0 + n * 130 + Math.floor(r() * 100);
  const keepBias = rank >= 30 ? 0.5 : rank > 0 ? 0.75 : 1;
  const x = r() * keepBias;
  const surviving = x < 0.13 ? 0 : x < 0.45 ? Math.round((size * (0.05 + r() * 0.9)) / 1000) * 1000 : size;
  const history: Event[] = [{ kind: 'issue', text: `Bought off the curve by ${short(buyer)}`, slot, at: boughtAt, sig: sig(r) }];
  if (surviving < size) {
    const s2 = slot + 4_000 + Math.floor(r() * 90_000);
    history.push({ kind: 'melt', text: `${fmt(size - surviving)} tokens melted: sold on an exchange`, slot: s2, at: boughtAt + (s2 - slot) * 0.4, sig: sig(r) });
  }
  const pieces: Piece[] = [];
  if (surviving > 0) {
    const sealed = r() < (rank > 0 ? 0.45 : 0.12) ? Math.round((surviving * (0.3 + r() * 0.7)) / 1000) * 1000 : 0;
    if (surviving - sealed > 0) pieces.push({ account: addr(r), holder: buyer, amount: surviving - sealed });
    if (sealed > 0) {
      const f: Folio = { address: addr(r), holder: buyer, status: 'sealed', segments: [{ strike: n, amount: sealed }], common: r() < 0.3 ? Math.round(r() * 400) * 1000 : 0, createdAt: boughtAt + 20_000 + Math.floor(r() * 40_000) };
      const s3 = slot + 120_000 + Math.floor(r() * 50_000);
      history.push({ kind: 'seal', text: `${fmt(sealed)} tokens sealed into folio ${short(f.address)}`, slot: s3, at: f.createdAt, sig: sig(r) });
      if (r() < 0.25) {
        const to = pick(); const price = +(0.2 + rank / 20 + r() * 1.5).toFixed(2);
        history.push({ kind: 'sale', text: `Folio ${short(f.address)} sold on the desk for ${price} SOL to ${short(to)}`, slot: s3 + 30_000, at: f.createdAt + 12_000, sig: sig(r) });
        f.holder = to;
      }
      if (r() < 0.45) {
        f.status = 'listed'; f.price = +(0.15 + rank ** 1.25 / 18 + r() * 1.2).toFixed(2);
        history.push({ kind: 'list', text: `Folio ${short(f.address)} listed for ${f.price} SOL`, slot: s3 + 60_000, at: f.createdAt + 24_000, sig: sig(r) });
      }
      FOLIOS.push(f); folioFor.set(f.address, f);
      pieces.push({ account: f.address, holder: f.holder, folio: f.address, amount: sealed });
    }
  }
  return { n, size, issued: size, surviving, position: pos.name, flaw, traits, rank, buyer, pieces, history, boughtAt, slot };
});
export const strike = (n: number) => (Number.isInteger(n) ? STRIKES[n] ?? null : null);
export const status = (s: Strike) => (s.issued === 0 ? 'unissued' : s.surviving === 0 ? 'melted' : 'surviving');
export const STATUSES: [string, string][] = [['surviving', 'Surviving'], ['melted', 'Fully melted'], ['unissued', 'Not yet issued']];
export const byRarity = (a: Strike, b: Strike) => b.rank - a.rank || a.n - b.n;

// ---- rolls: ordinary $TALLY sealed in a folio pays a small fee for a chance at a rolled tier
export function drawRoll(x: number) {
  let acc = 0;
  for (const t of ROLL_TIERS) { acc += t.odds; if (x * 1_000_000 < acc) return t; }
  return ROLL_BLANK;
}
const rr = rng(4242);
export const ROLL_COUNTS: Record<string, number> = Object.fromEntries(ALL_ROLL.map((t) => [t.name, 0]));
export const ROLL_FEED: RollEvent[] = [];
const TOTAL_ROLLS = 1_437;
for (let i = 0; i < TOTAL_ROLLS; i++) {
  const t = drawRoll(rr()); ROLL_COUNTS[t.name]++;
  const holder = WALLETS[Math.floor(rr() * WALLETS.length)];
  const slot = 412_300_000 + i * 310 + Math.floor(rr() * 200);
  ROLL_FEED.push({ holder, name: t.name, points: t.points, slot, at: SALE_START + 110_000 + i * 120, sig: sig(rr) });
  if (t.points > 0 && rr() < 0.82) {
    const f: Folio = { address: addr(rr), holder, status: 'sealed', segments: [], common: ROLL_MIN + Math.round(rr() * 30) * 10_000, roll: { name: t.name, points: t.points }, createdAt: SALE_START + 110_000 + i * 120 };
    if (rr() < 0.3) { f.status = 'listed'; f.price = +(0.05 + t.points ** 1.3 / 40 + rr() * 0.6).toFixed(2); }
    FOLIOS.push(f);
  }
}
ROLL_FEED.reverse();
export const TOTAL_ROLL_COUNT = TOTAL_ROLLS;

export function rollHeld(folios: Folio[]) {
  const held: Record<string, { count: number; listed: number; floor?: number }> = {};
  for (const f of folios) {
    if (!f.roll || f.roll.points === 0) continue;
    const h = (held[f.roll.name] ??= { count: 0, listed: 0 });
    h.count++;
    if (f.status === 'listed' && f.price) { h.listed++; h.floor = h.floor === undefined ? f.price : Math.min(h.floor, f.price); }
  }
  return held;
}

// ---- folio helpers
export const folioRank = (f: Folio) => Math.max(...f.segments.map((s) => STRIKES[s.strike].rank), f.roll?.points ?? -1, -1);
export const folioTraits = (f: Folio) => [...new Set([...f.segments.flatMap((s) => STRIKES[s.strike].traits), ...(f.roll ? [f.roll.name] : [])])];
export const folioTokens = (f: Folio) => f.segments.reduce((a, s) => a + s.amount, 0) + f.common;

// ---- totals
export function stats(strikes: Strike[] = STRIKES) {
  const issued = strikes.reduce((a, s) => a + s.issued, 0);
  const surviving = strikes.reduce((a, s) => a + s.surviving, 0);
  const holders = new Set(strikes.flatMap((s) => s.pieces.map((p) => p.holder))).size;
  const byBand = [0, 1, 2, 3].map((b) => strikes.filter((s) => band(s.rank) === b).length);
  const ranks = [...new Set(strikes.map((s) => s.rank))].sort((a, b) => a - b);
  const byRank = ranks.map((rank) => {
    const l = strikes.filter((s) => s.rank === rank);
    return { rank, strikes: l.length, issued: l.reduce((a, s) => a + s.issued, 0), surviving: l.reduce((a, s) => a + s.surviving, 0) };
  });
  return { issuedStrikes: strikes.filter((s) => s.issued > 0).length, issued, surviving, holders, byBand, byRank };
}

// ---- format helpers (function declarations so they are hoisted above the generators)
export function short(a: string, n = 4) { return `${a.slice(0, n)}...${a.slice(-n)}`; }
export function fmt(n: number) { return Math.round(n).toLocaleString('en-US'); }
export function pct(part: number, whole: number) {
  if (!whole) return '0';
  const p = (part / whole) * 100;
  return p === 100 ? '100' : p >= 99.95 ? '99.9' : p > 0 && p < 0.1 ? '<0.1' : p.toFixed(1);
}
export function share(part: number, whole: number) {
  if (!whole) return '';
  const p = (part / whole) * 100;
  return `${p < 1 ? p.toFixed(2) : p.toFixed(1)}%`;
}
export function ago(t: number) {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - t));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`;
}
export const solscan = (kind: 'tx' | 'account', v: string) => `https://solscan.io/${kind}/${v}`;
export const isAddress = (a: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
