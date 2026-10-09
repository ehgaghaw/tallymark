import { PageHead } from '../components/ui';
import { STRIKE_COUNT, TOKEN, ERAS } from '../lib/ledger';

const RULES: [string, string][] = [
  ['One million, one Strike', `Each full 1,000,000 ${TOKEN} bought off the bonding curve is recorded as one Strike. Partial millions carry over to the same wallet until they complete one.`],
  ['Order is everything', 'Strikes are numbered in the order the buys land on chain. Same block, lower transaction index wins.'],
  ['A fixed count', `The curve sells enough tokens for ${STRIKE_COUNT} Strikes. When it closes, no new Strikes are cut.`],
  ['Eras by number', `Each Strike belongs to an era set only by its number: ${ERAS.map((e) => `${e.name} ${e.from}-${e.to}`).join(', ')}.`],
  ['Tiers are rolled later', 'Tiers are drawn after the sale from a public block hash agreed in advance, so nobody can pick a tier by timing a buy.'],
  ['Holding keeps the mark', 'A Strike stands while its million stays in the wallet that bought it. Sell part and the Strike melts by that share.'],
  ['Melted is final', 'Buying back later does not repair a melted Strike. New buys after the curve closes do not create Strikes.'],
  ['Transfers', 'Moving tokens to another wallet counts as leaving. The Desk is the way to hand a Strike over intact.'],
  ['No promises', 'Strikes are a record, not a claim on anything. This is an experiment. Do not spend money you need.'],
];

export default function Rules() {
  return (
    <>
      <PageHead title="Rules" sub="The whole ledger runs on nine rules. They are short on purpose." />
      <div className="prose">
        {RULES.map(([h, p], i) => (
          <div key={h}>
            <h2><span className="rules-n">{String(i + 1).padStart(2, '0')}</span>{h}</h2>
            <p>{p}</p>
          </div>
        ))}
      </div>
    </>
  );
}
