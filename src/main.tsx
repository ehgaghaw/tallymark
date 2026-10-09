import React, { useEffect, useState } from 'react';
import { WalletProvider, useWallet, X_URL } from './lib/wallet';
import ReactDOM from 'react-dom/client';
import { HashRouter, NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import './styles.css';
import { PREVIEW } from './lib/ledger';
import Overview from './pages/Overview';
import Rules from './pages/Rules';
import Traits from './pages/Traits';
import Glossary from './pages/Glossary';
import Live from './pages/Live';
import Strikes from './pages/Strikes';
import StrikePage from './pages/Strike';
import Rolls from './pages/Rolls';
import Desk from './pages/Desk';
import Wallet from './pages/Wallet';

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 28 20" shapeRendering="crispEdges" aria-hidden>
      <rect width="28" height="20" fill="#000" />
      <g fill="#fff"><rect x="4" y="4" width="2" height="12" /><rect x="9" y="4" width="2" height="12" /><rect x="14" y="4" width="2" height="12" /><rect x="19" y="4" width="2" height="12" /><rect x="2" y="9" width="22" height="2" /></g>
    </svg>
  );
}

function Header() {
  const { address, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const link = (to: string, label: string, end = false) => <NavLink to={to} end={end} className={({ isActive }) => `u${isActive ? ' on' : ''}`}>{label}</NavLink>;
  return (
    <header className="site-header">
      {PREVIEW && <div className="preview-band small u">Preview ledger: demo data until {'$TALLY'} launches</div>}
      <div className="container header-inner">
        <Link to="/" className="brand"><Logo /><span className="u">Tallymark</span></Link>
        <nav className={`nav${open ? ' open' : ''}`}>
          {link('/', 'Overview', true)}{link('/rules', 'Rules')}{link('/traits', 'Traits')}{link('/glossary', 'Glossary')}
          <span className="sep" />
          <NavLink to="/live" className={({ isActive }) => `u nav-live${isActive ? ' on' : ''}`}><i />Live</NavLink>
          {link('/strikes', 'Strikes')}{link('/rolls', 'Rolls')}{link('/desk', 'Desk')}{link('/wallet', 'My wallet')}
        </nav>
        <div className="header-right">
          <button className="btn btn-ghost nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">{open ? 'Close' : 'Menu'}</button>
          <a className="btn x-btn" href={X_URL} target="_blank" rel="noopener" aria-label="Tallymark on X">X</a>
          {address
            ? <button className="btn btn-primary" onClick={disconnect} title="Disconnect">{address.slice(0, 4)}...{address.slice(-4)}</button>
            : <button className="btn btn-primary" onClick={connect}>Connect<span>&nbsp;wallet</span></button>}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner u small">
        <span>&copy; {new Date().getFullYear()} Tallymark</span>
        <span><a href={X_URL} target="_blank" rel="noopener">X</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<Link to="/rules">Rules</Link>&nbsp;&nbsp;&middot;&nbsp;&nbsp;Not financial advice</span>
      </div>
    </footer>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function App() {
  return (
    <HashRouter>
      <WalletProvider>
        <ScrollTop />
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/traits" element={<Traits />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/live" element={<Live />} />
            <Route path="/strikes" element={<Strikes />} />
            <Route path="/strike/:n" element={<StrikePage />} />
            <Route path="/rolls" element={<Rolls />} />
            <Route path="/desk" element={<Desk />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="*" element={<div className="page-head"><div><h1>Not on the ledger</h1><p className="page-sub">That page does not exist. <Link to="/strikes" className="u">Browse Strikes</Link></p></div></div>} />
          </Routes>
        </main>
        <Footer />
      </WalletProvider>
    </HashRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
