// Preview store: wallet actions (seal, list, gift, buy, withdraw, roll) run against local state so
// every page behaves like it will after launch. Nothing is sent to the chain in preview.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ALL_ROLL, FOLIOS, Folio, ROLL_COUNTS, ROLL_FEED, ROLL_MIN, RollEvent, STRIKES, Segment, Strike, addr, drawRoll, folioTokens, rng, short, fmt } from './ledger';
import { useWallet } from './wallet';

export type Account = { account: string; segments: Segment[] };
type Mine = { accounts: Account[]; ordinary: number };
type Store = {
  strikes: Strike[]; folios: Folio[]; feed: RollEvent[]; counts: Record<string, number>; mine: Mine | null;
  toast: string; say: (m: string) => void;
  seal: (account: string, strikes: number[]) => void;
  sealOrdinary: (amount: number) => void;
  list: (f: string, price: number) => void; cancel: (f: string) => void;
  gift: (f: string, to: string) => void; buy: (f: string) => void; withdraw: (f: string) => void;
  roll: (f: string) => { name: string; points: number } | null;
};
const Ctx = createContext<Store>(null as unknown as Store);
export const useStore = () => useContext(Ctx);

const hash = (s: string) => [...s].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
const now = () => Math.floor(Date.now() / 1000);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const [strikes, setStrikes] = useState<Strike[]>(STRIKES);
  const [folios, setFolios] = useState<Folio[]>(FOLIOS);
  const [feed, setFeed] = useState<RollEvent[]>(ROLL_FEED);
  const [counts, setCounts] = useState<Record<string, number>>(ROLL_COUNTS);
  const [mine, setMine] = useState<Mine | null>(null);
  const [toast, setToast] = useState('');
  const say = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast((t) => (t === m ? '' : t)), 3200); }, []);

  // On connect, hand the wallet a stable slice of the preview ledger so every action can be tried.
  useEffect(() => {
    if (!address) { setMine(null); return; }
    const r = rng(hash(address));
    const pool = STRIKES.filter((s) => s.pieces.some((p) => !p.folio));
    const picks = new Set<number>();
    pool.filter((s) => s.rank > 0).slice(Math.floor(r() * 20)).slice(0, 40).forEach((s) => r() < 0.12 && picks.size < 4 && picks.add(s.n));
    while (picks.size < 9) picks.add(pool[Math.floor(r() * pool.length)].n);
    const accts = [addr(r), addr(r)];
    const accounts: Account[] = accts.map((a) => ({ account: a, segments: [] }));
    setStrikes((prev) => prev.map((s) => {
      if (!picks.has(s.n)) return s;
      const i = s.pieces.findIndex((p) => !p.folio);
      const acct = accounts[s.n % 2];
      acct.segments.push({ strike: s.n, amount: s.pieces[i].amount });
      const pieces = s.pieces.slice(); pieces[i] = { ...pieces[i], account: acct.account, holder: address };
      return { ...s, buyer: address, pieces };
    }));
    accounts.forEach((a) => a.segments.sort((x, y) => x.strike - y.strike));
    const extra: Folio = { address: addr(r), holder: address, status: 'sealed', segments: [], common: 120_000, roll: { name: 'Blank', points: 0 }, createdAt: now() - 7200 };
    setFolios((prev) => [...prev, extra]);
    setMine({ accounts: accounts.filter((a) => a.segments.length), ordinary: 2_340_000 + Math.floor(r() * 900) * 1000 });
  }, [address]);

  const patchFolio = (a: string, f: (x: Folio) => Folio | null) => setFolios((prev) => prev.flatMap((x) => (x.address === a ? (f(x) ? [f(x)!] : []) : [x])));

  const api = useMemo<Store>(() => ({
    strikes, folios, feed, counts, mine, toast, say,
    seal(account, picked) {
      if (!address || !mine) return;
      const acct = mine.accounts.find((a) => a.account === account); if (!acct) return;
      const segs = acct.segments.filter((s) => picked.includes(s.strike));
      const f: Folio = { address: addr(Math.random), holder: address, status: 'sealed', segments: segs, common: 0, createdAt: now() };
      setFolios((p) => [f, ...p]);
      setMine({ ...mine, accounts: mine.accounts.map((a) => (a.account === account ? { ...a, segments: a.segments.filter((s) => !picked.includes(s.strike)) } : a)).filter((a) => a.segments.length) });
      setStrikes((prev) => prev.map((s) => {
        if (!picked.includes(s.n)) return s;
        return { ...s, pieces: s.pieces.map((p) => (p.account === account ? { ...p, account: f.address, folio: f.address } : p)),
          history: [...s.history, { kind: 'seal', text: `${fmt(segs.find((g) => g.strike === s.n)!.amount)} tokens sealed into folio ${short(f.address)}`, slot: 0, at: now(), sig: '' }] };
      }));
      say(`Sealed ${segs.length} Strike${segs.length === 1 ? '' : 's'} into folio ${short(f.address)}`);
    },
    sealOrdinary(amount) {
      if (!address || !mine || amount < ROLL_MIN || amount > mine.ordinary) return;
      setFolios((p) => [{ address: addr(Math.random), holder: address, status: 'sealed', segments: [], common: amount, createdAt: now() }, ...p]);
      setMine({ ...mine, ordinary: mine.ordinary - amount });
      say(`Sealed ${fmt(amount)} ordinary $TALLY into a new folio`);
    },
    list(a, price) { patchFolio(a, (f) => ({ ...f, status: 'listed', price })); say(`Listed on the desk for ${price} SOL`); },
    cancel(a) { patchFolio(a, (f) => ({ ...f, status: 'sealed', price: undefined })); say('Listing cancelled'); },
    gift(a, to) { patchFolio(a, (f) => ({ ...f, holder: to, status: 'sealed', price: undefined })); say(`Gifted to ${short(to)}`); },
    buy(a) {
      if (!address) return;
      const f = folios.find((x) => x.address === a);
      patchFolio(a, (x) => ({ ...x, holder: address, status: 'sealed', price: undefined }));
      say(`Bought folio ${short(a)}${f?.price ? ` for ${f.price} SOL` : ''}`);
    },
    withdraw(a) {
      const f = folios.find((x) => x.address === a); if (!f) return;
      patchFolio(a, () => null);
      setStrikes((prev) => prev.map((s) => {
        const seg = f.segments.find((g) => g.strike === s.n); if (!seg) return s;
        return { ...s, surviving: Math.max(0, s.surviving - seg.amount), pieces: s.pieces.filter((p) => p.folio !== a),
          history: [...s.history, { kind: 'unseal', text: `${fmt(seg.amount)} tokens melted: folio ${short(a)} withdrawn`, slot: 0, at: now(), sig: '' }] };
      }));
      if (mine) setMine({ ...mine, ordinary: mine.ordinary + folioTokens(f) });
      say(`Withdrawn. ${fmt(folioTokens(f))} tokens are ordinary $TALLY now`);
    },
    roll(a) {
      const f = folios.find((x) => x.address === a);
      if (!f || !address || f.common < ROLL_MIN || (f.roll && f.roll.points > 0)) return null;
      const t = drawRoll(Math.random());
      patchFolio(a, (x) => ({ ...x, roll: { name: t.name, points: t.points } }));
      setCounts((c) => ({ ...c, [t.name]: (c[t.name] ?? 0) + 1 }));
      setFeed((p) => [{ holder: address, name: t.name, points: t.points, slot: p[0].slot + 400, at: now(), sig: '' }, ...p]);
      return { name: t.name, points: t.points };
    },
  }), [strikes, folios, feed, counts, mine, toast, address, say]);

  return <Ctx.Provider value={api}>{children}{toast && <div className="toast small">{toast}</div>}</Ctx.Provider>;
}
export const ROLL_NAMES = ALL_ROLL.map((t) => t.name);
