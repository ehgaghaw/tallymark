// Tallymark preview ledger. Until $TALLY launches, the site runs on deterministic demo data
// with the real shape: every 1,000,000 tokens bought off the curve is a numbered Strike.
// Strike numbers follow purchase order. Eras come from the Strike number; tiers are drawn after
// the sale from a public block hash (simulated here with a fixed seed).

export const TOKEN = '$TALLY';
export const STRIKE_SIZE = 1_000_000;
export const STRIKE_COUNT = 794;
export const PREVIEW = true;

export type Tier = 0 | 1 | 2 | 3;
export const TIERS: { tier: Tier; name: string; odds: string; blurb: string }[] = [
  { tier: 0, name: 'Plain', odds: '82%', blurb: 'The bulk of the ledger. A number, an era, nothing more.' },
  { tier: 1, name: 'Marked', odds: '13%', blurb: 'One mark in the margin. Easy to spot, worth a second look.' },
  { tier: 2, name: 'Double', odds: '4.5%', blurb: 'Two marks. A handful per era.' },
  { tier: 3, name: 'Crossed', odds: '0.5%', blurb: 'The tally that closes the count. About four exist.' },
];

export const ERAS = [
  { name: 'First Light', from: 1, to: 5, note: 'The opening five Strikes.' },
  { name: 'Early Hours', from: 6, to: 60 },
  { name: 'Open Market', from: 61, to: 400 },
  { name: 'Late Count', from: 401, to: 780 },
  { name: 'Last Call', from: 781, to: STRIKE_COUNT, note: 'The final Strikes before the curve closes.' },
];
export const eraOf = (n: number) => ERAS.find((e) => n >= e.from && n <= e.to)!;

// small seeded PRNG (mulberry32) so the preview is stable between reloads
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const addr = (r: () => number) => Array.from({ length: 44 }, () => B58[Math.floor(r() * 58)]).join('');

export type Strike = {
  n: number; era: string; tier: Tier;
  holder: string; holders: number;
  surviving: number; // tokens still held as Strike (not melted)
  boughtAt: number; // unix seconds
  slot: number;
};

const r = rng(20261009);
const wallets = Array.from({ length: 160 }, () => addr(r));
const start = Date.UTC(2026, 9, 8, 16, 0) / 1000;

export const STRIKES: Strike[] = Array.from({ length: STRIKE_COUNT }, (_, i) => {
  const n = i + 1;
  const x = r();
  const tier: Tier = x < 0.005 ? 3 : x < 0.05 ? 2 : x < 0.18 ? 1 : 0;
  const melted = r() < 0.22 ? Math.floor(r() * STRIKE_SIZE) : 0;
  return {
    n, era: eraOf(n).name, tier,
    holder: wallets[Math.floor(r() ** 1.6 * wallets.length)],
    holders: 1 + Math.floor(r() ** 3 * 6),
    surviving: STRIKE_SIZE - melted,
    boughtAt: start + Math.floor(i * 47 + r() * 40),
    slot: 412_000_000 + i * 118 + Math.floor(r() * 90),
  };
});
export const strike = (n: number) => STRIKES[n - 1] ?? null;

export const totals = () => {
  const surviving = STRIKES.reduce((a, s) => a + s.surviving, 0);
  const holders = new Set(STRIKES.map((s) => s.holder)).size;
  const byTier = TIERS.map((t) => STRIKES.filter((s) => s.tier === t.tier).length);
  return { strikes: STRIKE_COUNT, surviving, melted: STRIKE_COUNT * STRIKE_SIZE - surviving, holders, byTier };
};

export type Roll = { id: number; slot: number; blockhash: string; at: number; results: { n: number; tier: Tier }[] };
export const ROLLS: Roll[] = Array.from({ length: 6 }, (_, i) => {
  const rr = rng(77 + i);
  const results = STRIKES.filter((s) => s.tier > 0).filter((_, k) => k % 6 === i).slice(0, 8).map((s) => ({ n: s.n, tier: s.tier }));
  return { id: 6 - i, slot: 412_120_000 - i * 2_400, blockhash: addr(rr), at: start + 40_000 - i * 3_600, results };
});

export type Listing = { n: number; seller: string; askSol: number; postedAt: number };
export const LISTINGS: Listing[] = STRIKES.filter((s) => s.tier >= 1).filter((_, i) => i % 5 === 0).slice(0, 14).map((s, i) => ({
  n: s.n, seller: s.holder, askSol: +(0.4 + s.tier * s.tier * 1.7 + (i % 4) * 0.35).toFixed(2), postedAt: start + 50_000 - i * 1_900,
}));

export const short = (a: string, n = 4) => `${a.slice(0, n)}...${a.slice(-n)}`;
export const fmt = (n: number) => n.toLocaleString('en-US');
export const ago = (t: number) => {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - t));
  return s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`;
};
