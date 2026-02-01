import { fetchPatchList } from '../lib/crawler/index';

async function main() {
  try {
    const patches = await fetchPatchList();
    console.log(`Successfully fetched ${patches.length} patches.`);
    
    patches.forEach(p => {
      console.log(`[${p.version}] ${p.date} - ${p.title}`);
      console.log(`  URL: ${p.url}`);
    });
  } catch (error) {
    console.error('Error fetching patch list:', error);
  }
}

main();
