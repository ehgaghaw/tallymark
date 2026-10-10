import { useState } from 'react';
import { PageHead } from '../components/ui';

const TERMS: [string, string][] = [
  ['After the curve', 'Bought once the bonding curve has sold out, on any exchange. These tokens are ordinary, but they can be sealed in a folio and rolled for a rolled tier.'],
  ['Band', 'Short for rarity band. One of four groups set by points: Common, Uncommon, Rare and Legendary.'],
  ['Blank', 'The roll result that wins nothing, Common. A Blank folio can roll again.'],
  ['Bonding curve', 'The pump.fun sale that first sells $TALLY, at a price that rises with each purchase. Only tokens bought here get numbers.'],
  ['Carry Over', 'A rolled tier, Rare. Named for the total brought forward to the top of a new page.'],
  ['Closing Line', 'A rolled tier, Legendary. Named for the double rule drawn under a finished count.'],
  ['Collector', 'Someone who buys $TALLY for its rarity, paying for rare Strikes or rolled tiers on the desk rather than treating every token the same.'],
  ['Collector desk', 'Where sealed folios are listed and bought. Also called the desk.'],
  ['Commitment', 'The fingerprint of the rules file, posted on chain before the first token was sold, so the rules cannot change afterwards.'],
  ['Common', 'The lowest rarity band, 0 points.'],
  ['Cross-Check', 'A rolled tier, Rare. Named for a count done twice to be sure.'],
  ['Desk', 'Short for the collector desk: where sealed folios are listed for sale and bought. The tokens never leave the vault, so their rarity stays intact.'],
  ['Desk fee', 'The 1.5% of each desk sale that goes to the Tallymark treasury.'],
  ['Double Stroke', 'The rarest flaw, Legendary. The pen went over the same line twice. Only three exist.'],
  ['Early Hours', 'The position trait of Strikes #5 to #24, bought before most people knew the count had started.'],
  ['Exchange', 'Any market where $TALLY trades after the curve. Every token is priced the same there.'],
  ['Fingerprint', 'A hash of the whole ledger, published by the indexer so anyone running their own copy can compare.'],
  ['First Light', 'The position trait of Strikes #0 to #4, the first five sold. The opening marks on the wall.'],
  ['Five-Bar Gate', 'A rolled tier, Rare. Named for the four strokes and the one drawn across them.'],
  ['Flaw', 'A random trait drawn after the sale from a Solana block nobody could predict. A Strike has at most one.'],
  ['Folio', 'A vault run by the Tallymark program that holds sealed tokens. The tokens never move again, so the folio can be sold without melting.'],
  ['Full Page', 'A rolled tier, Legendary. Named for a page with no room left for one more mark.'],
  ['Fully melted', 'A Strike with none of its tokens still rare. Every one has been sold, sent or withdrawn.'],
  ['Gift', 'Giving a folio to another wallet. Nothing melts.'],
  ['Grand Total', 'The rarest rolled tier, Legendary. Named for the sum at the foot of the last page.'],
  ['Hashmark', 'A rolled tier, Uncommon. Named for a short line that marks a place.'],
  ['Indexer', 'The open source software that reads the chain and applies the Tallymark rules. Anyone can run it.'],
  ['Ink Blot', 'A flaw, Legendary. A drop of ink landed on the page and swallowed the mark. Six exist.'],
  ['Last Call', 'The position trait of Strike #793, the short last Strike that closes the curve.'],
  ['Legendary', 'The highest rarity band, 70 points and up.'],
  ['List', 'Putting a folio up for sale on the desk at a price.'],
  ['Melt', 'What happens to rare tokens that leave their origin account or folio. They become ordinary $TALLY for good.'],
  ['Not yet issued', 'A Strike not yet bought off the bonding curve.'],
  ['Notch', 'A rolled tier, Uncommon. Named for a cut in a stick, the oldest way to count.'],
  ['On the curve', 'Bought from the bonding curve during the sale. These tokens get numbers, and their Strikes can carry position traits and flaws.'],
  ['Open Count', 'The position trait of every Strike that is not First Light, Early Hours or Last Call. Bought in the long middle of the sale.'],
  ['Ordinary $TALLY', 'Tokens with no rarity: bought after the curve, or melted.'],
  ['Origin account', 'The account that bought tokens off the curve. One of the two places rarity can live.'],
  ['Points', 'The score of each trait or rolled tier. They add up to a Strike\'s rank and set its rarity.'],
  ['Position', 'A token\'s number, given in the order it was bought off the curve. Also the trait a Strike gets from where it sits on the curve.'],
  ['Position trait', 'The trait a Strike gets from its number. Known from the moment it is sold.'],
  ['Rank', 'A Strike\'s position points plus its flaw points. Higher is rarer.'],
  ['Rare', 'The rarity band from 30 to 69 points.'],
  ['Rarity', 'The overall grade of one Strike or one rolled folio: Common, Uncommon, Rare or Legendary. It comes from the points of its traits, not from your whole bag.'],
  ['Reveal', 'The moment the flaws are drawn and published, after the curve sells out.'],
  ['Roll', 'Paying 0.01 SOL for a chance that a folio of at least 50,000 ordinary $TALLY wins a rolled tier.'],
  ['Rolled tier', 'One of ten tiers a folio can win by rolling, from Tick to Grand Total.'],
  ['Running Total', 'A rolled tier, Uncommon. Named for the sum so far, kept in the margin.'],
  ['Seal', 'Moving tokens into a folio. The only time sealed tokens ever move.'],
  ['Seed block', 'The Solana block, produced after the sale, whose hash decides the flaws or a roll.'],
  ['Skipped Line', 'A flaw, Rare. The counter jumped a line, so the mark sits where no mark should be.'],
  ['Smudge', 'A flaw, Uncommon. A thumb dragged across wet ink and left a grey trail. The most common flaw, 48 exist.'],
  ['Status', 'Where a Strike stands now: Surviving, Fully melted or Not yet issued. You can filter Strikes by it.'],
  ['Strike', 'A block of one million numbered tokens. There are 794, from #0 to #793.'],
  ['Surviving', 'A Strike with some of its tokens still rare. The share still rare can only go down.'],
  ['$TALLY', 'The token Tallymark counts. Every million bought off the curve is a Strike.'],
  ['Tallymark', 'The idea and the site: give each token of a fungible coin a number and a history, without changing the token.'],
  ['Tick', 'The most common rolled tier, Uncommon. Named for a small mark that says counted.'],
  ['Token account', 'Where your wallet keeps its $TALLY on Solana. A wallet can have more than one. Rarity stays in the token account that bought it off the curve.'],
  ['Torn Corner', 'A flaw, Rare. The page tore at the edge and took part of the mark with it.'],
  ['Trait', 'A label a Strike can carry, like First Light or Double Stroke.'],
  ['Uncommon', 'The rarity band from 1 to 29 points.'],
  ['Verify', 'Recomputing traits or checking a listing in your own browser, with no trust in this website.'],
  ['Withdraw', 'Taking tokens out of a folio. It closes the folio and melts them.'],
];

const key = (t: string) => t.replace(/^\$/, '');

export default function Glossary() {
  const [q, setQ] = useState('');
  const n = q.trim().toLowerCase();
  const list = TERMS.filter(([t, d]) => !n || t.toLowerCase().includes(n) || d.toLowerCase().includes(n)).sort((a, b) => key(a[0]).localeCompare(key(b[0])));
  const groups = new Map<string, [string, string][]>();
  for (const e of list) { const L = key(e[0])[0].toUpperCase(); groups.set(L, [...(groups.get(L) ?? []), e]); }
  return (
    <>
      <PageHead title="Glossary" sub="Every name and key term in Tallymark, A to Z." />
      <section className="panel glossary">
        <input className="glossary-search" placeholder="Search the glossary" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" />
        {!list.length && <p className="muted">Nothing matches "{q}".</p>}
        {[...groups].map(([L, rows]) => (
          <div className="glossary-group" key={L}>
            <span className="glossary-letter">{L}</span>
            <dl>{rows.map(([t, d]) => <div className="glossary-row" key={t}><dt>{t}</dt><dd className="muted">{d}</dd></div>)}</dl>
          </div>
        ))}
      </section>
    </>
  );
}
