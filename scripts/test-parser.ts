import { parsePatchDetail } from '../lib/parser/index';
// @ts-ignore
import * as cheerio from 'cheerio';

async function main() {
  const url = 'https://www.leagueoflegends.com/ko-kr/news/game-updates/patch-25-24-notes/';
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);
  const html = await response.text();

  console.log('Parsing...');
  const results = parsePatchDetail(html);

  console.log(`Parsed ${results.length} items.`);
  
  results.slice(0, 3).forEach(item => {
      console.log(`\nName: ${item.name} [${item.changeType}]`);
      item.attributes.forEach(attr => {
          console.log(`  - ${attr.name}: ${attr.before} -> ${attr.after}`);
      });
  });
}

main();
