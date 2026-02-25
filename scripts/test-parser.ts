import { parsePatchDetail } from '../lib/parser/index';

async function main() {
  const url = 'https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-4-notes';
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);
  const html = await response.text();

  console.log('Parsing...');
  const results = parsePatchDetail(html);

  console.log(`Parsed ${results.length} items.`);
  const byCat = results.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {} as Record<string, number>);
  console.log('By category:', byCat);

  const items = results.filter(r => r.category === 'item');
  const system = results.filter(r => r.category === 'system');
  console.log('\n--- Sample items:', items.slice(0, 2).map(i => i.name));
  console.log('--- Sample system:', system.slice(0, 2).map(s => s.name));

  results.slice(0, 3).forEach(item => {
      console.log(`\nName: ${item.name} [${item.category}] [${item.changeType}]`);
      item.attributes.slice(0, 2).forEach(attr => {
          console.log(`  - ${attr.name}: ${attr.before} -> ${attr.after}`);
      });
  });
}

main();
