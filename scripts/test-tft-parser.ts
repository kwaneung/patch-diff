import { parseTftPatchDetail } from '../lib/parser/tft';

async function main() {
  const url = 'https://teamfighttactics.leagueoflegends.com/ko-kr/news/game-updates/teamfight-tactics-patch-16-4';
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);
  const html = await response.text();

  console.log('Parsing...');
  const results = parseTftPatchDetail(html);

  console.log(`Parsed ${results.length} items.`);
  const byCat = results.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {} as Record<string, number>);
  console.log('By category:', byCat);

  results.slice(0, 5).forEach((item) => {
    console.log(`\n${item.name} [${item.category}] [${item.changeType}]`);
    item.attributes.slice(0, 1).forEach((attr) => {
      console.log(`  - ${attr.name}: ${attr.before} -> ${attr.after}`);
    });
  });
}

main();
