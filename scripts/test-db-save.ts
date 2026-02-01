import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// import { crawlAndSavePatches } from '../lib/crawler/save';

async function main() {
  console.log('Testing DB Save...');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY in process.env');
      return;
  }
  
  // Dynamic import to ensure env is loaded first
  const { crawlAndSavePatches } = await import('../lib/crawler/save');
  
  await crawlAndSavePatches();
  console.log('Done.');
}

main().catch(console.error);
