import * as cheerio from 'cheerio';

async function main() {
  const url = 'https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/';
  console.log(`Fetching ${url}...`);
  
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  console.log('Page Title:', $('title').text());

  // Try to find list items. 
  // Based on common knowledge of LoL site, they are usually in a grid or list.
  // We'll look for 'a' tags that contain '패치 노트' in their text or finding article tags.
  
  const items: any[] = [];

  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    
    // Filter for common patch note patterns
    if (href && (href.includes('patch-') && href.includes('-notes') || text.includes('패치 노트'))) {
       items.push({
         text,
         href,
         class: $(el).attr('class')
       });
    }
  });

  console.log(`Found ${items.length} potential patch note links.`);
  items.slice(0, 5).forEach((item, index) => {
    console.log(`[${index}] Text: ${item.text}`);
    console.log(`      Href: ${item.href}`);
    console.log(`      Class: ${item.class}`);
  });
}

main().catch(console.error);
