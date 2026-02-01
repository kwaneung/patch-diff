import * as cheerio from 'cheerio';

async function main() {
  const url = 'https://www.leagueoflegends.com/ko-kr/news/game-updates/patch-25-24-notes/'; // Using a slightly older one as example 
  console.log(`Fetching ${url}...`);
  
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  console.log('Title:', $('title').text());

  // Inspect headers to find champions
  console.log('\n--- Headers (h2, h3, h4) ---');
  $('h2, h3, h4').slice(0, 10).each((_, el) => {
    console.log(`[${el.tagName}] ${$(el).text().trim()} (class: ${$(el).attr('class')})`);
  });
  
  // Inspect content blocks
  // Usually changes are in 'ul' > 'li' or 'p'
  console.log('\n--- Content Snippet (first champion likely) ---');
  const firstH3 = $('h3').first();
  if (firstH3.length) {
    console.log('First H3:', firstH3.text());
    console.log('Next Siblings:');
    let next = firstH3.next();
    for (let i = 0; i < 5; i++) {
        if (!next.length) break;
        console.log(`  [${next[0].tagName}] Text: ${next.text().substring(0, 100)}...`);
        next = next.next();
    }
  }
}

main().catch(console.error);
