import { Link } from 'react-router-dom';
import { PageHead } from '../components/ui';
import { DESK_FEE_BPS, FLAWS, POSITIONS, ROLL_FEE_SOL, ROLL_MIN, STRIKE_COUNT, TOKEN, fmt } from '../lib/ledger';

const RULES: [string, string][] = [
  ['Every token gets a number', `Tokens bought off the bonding curve are numbered in the order they were bought. Same block, lower transaction index first.`],
  ['A million make a Strike', `Each block of 1,000,000 numbered tokens is one Strike. There are ${STRIKE_COUNT}, from #0 to #${STRIKE_COUNT - 1}. The last is short.`],
  ['Position traits', `A Strike's number decides its position trait: ${POSITIONS.map((p) => `${p.name} (${p.points} points)`).join(', ')}, or Open Count for the rest.`],
  ['Flaws are drawn later', `After the curve sells out, a public seed block places ${FLAWS.reduce((a, f) => a + f.count, 0)} flaws: ${FLAWS.map((f) => `${f.count} ${f.name}`).join(', ')}. Nobody can pick a flaw by timing a buy.`],
  ['Points make rank', 'Position points plus flaw points is a Strike\'s rank. Rank sets the band: Common at 0, Uncommon to 29, Rare to 69, Legendary from 70.'],
  ['Rarity lives in two places', 'Rare tokens stay rare in the token account that bought them off the curve, or sealed in a folio. Nowhere else.'],
  ['Leaving melts', 'Selling, sending, or withdrawing from a folio melts those tokens into ordinary ' + TOKEN + '. Melting is permanent. The highest-numbered tokens leave a wallet first.'],
  ['Folios move without melting', `A folio can be listed on the desk, bought or gifted while the tokens stay in the vault. The desk takes a ${DESK_FEE_BPS / 100}% fee.`],
  ['Anyone can roll', `A folio of at least ${fmt(ROLL_MIN)} ordinary ${TOKEN} can pay ${ROLL_FEE_SOL} SOL to roll for one of ten tiers, decided by a block produced after the roll.`],
  ['The rules are committed', 'A fingerprint of this rules file was posted on chain before the first token sold. The indexer is open source. You can verify every trait in your browser.'],
  ['No promises', 'Strikes are a record, not a claim on anything. This is an experiment. Do not spend money you need.'],
];

export default function Rules() {
  return (
    <>
      <PageHead title="Rules" sub="The whole ledger runs on eleven rules. They are short on purpose." />
      <section className="panel">
        <div className="prose">
          {RULES.map(([h, p], i) => (
            <div key={h}><h2><span className="rules-n">{String(i + 1).padStart(2, '0')}</span>{h}</h2><p>{p}</p></div>
          ))}
          <p className="small muted">Words you do not know are in the <Link to="/glossary">glossary</Link>.</p>
        </div>
      </section>
    </>
  );
}
