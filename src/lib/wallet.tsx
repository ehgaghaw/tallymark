import React, { createContext, useContext, useEffect, useState } from 'react';

type Phantom = { connect: (o?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>; disconnect: () => Promise<void> };
const phantom = (): Phantom | null => {
  const w = window as unknown as { phantom?: { solana?: Phantom }; solana?: Phantom };
  return w.phantom?.solana ?? w.solana ?? null;
};

type Ctx = { address: string | null; connect: () => void; disconnect: () => void };
const WalletCtx = createContext<Ctx>({ address: null, connect: () => {}, disconnect: () => {} });
export const useWallet = () => useContext(WalletCtx);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => { phantom()?.connect({ onlyIfTrusted: true }).then((r) => setAddress(r.publicKey.toString())).catch(() => {}); }, []);
  const connect = async () => {
    const p = phantom();
    if (!p) { window.open('https://phantom.app/', '_blank'); return; }
    try { setAddress((await p.connect()).publicKey.toString()); } catch { /* rejected */ }
  };
  const disconnect = async () => { await phantom()?.disconnect().catch(() => {}); setAddress(null); };
  return <WalletCtx.Provider value={{ address, connect, disconnect }}>{children}</WalletCtx.Provider>;
}

export const X_URL = 'https://x.com/tallymarkfun';
