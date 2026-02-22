import * as cheerio from 'cheerio';
import { PatchListUrl } from './types';

const BASE_URL = 'https://www.leagueoflegends.com';
const LIST_URL = 'https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/';

const TFT_BASE_URL = 'https://teamfighttactics.leagueoflegends.com';
const TFT_LIST_URL = 'https://teamfighttactics.leagueoflegends.com/ko-kr/news/game-updates/';

export async function fetchPatchList(): Promise<PatchListUrl[]> {
  const response = await fetch(LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch patch list: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const patches: PatchListUrl[] = [];
  
  $('a').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text();

    if (!href) return;

    // Filter for LoL (Summoner's Rift) patch note links only
    // Format (old): /ko-kr/news/game-updates/patch-26-2-notes/
    // Format (new): /ko-kr/news/game-updates/league-of-legends-patch-26-4-notes
    // Exclude TFT: teamfight-tactics-patch-*, tft-* etc.
    if (/tft|teamfight-tactics/i.test(href)) return;
    const match = href.match(/\/ko-kr\/news\/game-updates\/(?:league-of-legends-)?patch-(\d+)-(\d+)-notes/);
    
    // Additional check to ensure it's a patch note and not something else
    // e.g. TFT patch notes usually have 'tft' in url, but sometimes share format.
    // 'LoL' patch notes usually don't have 'tft'.
    // Let's assume the URL pattern is reliable for now.
    
    if (match) {
      // Extract Version
      const major = match[1];
      const minor = match[2];
      const version = `${major}.${minor}`;
      
      // Extract Date
      // The text usually contains an ISOString like 2026-01-21T19:00:00.000Z
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString();

      // Extract Title
      // We can take the whole text or try to find the specific header if structure allows.
      // For now, let's assume the title is "X.X 패치 노트" which is usually present.
      const titleMatch = text.match(/(\d+\.\d+)\s+패치\s+노트/);
      const title = titleMatch ? titleMatch[0] : `${version} 패치 노트`;

      patches.push({
        version,
        url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
        date,
        title,
      });
    }
  });

  // Remove duplicates based on version (just in case)
  const uniquePatches = Array.from(new Map(patches.map(item => [item.version, item])).values());
  
  // Sort by version descending (newest first)
  // 14.2 > 14.1 > 13.24
  uniquePatches.sort((a, b) => {
    const [aMajor, aMinor] = a.version.split('.').map(Number);
    const [bMajor, bMinor] = b.version.split('.').map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    return bMinor - aMinor;
  });

  return uniquePatches;
}

export async function fetchTftPatchList(): Promise<PatchListUrl[]> {
  const response = await fetch(TFT_LIST_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch TFT patch list: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const patches: PatchListUrl[] = [];

  $('a').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text();

    if (!href) return;

    const match = href.match(/\/ko-kr\/news\/game-updates\/teamfight-tactics-patch-(\d+)-(\d+)/);
    if (match) {
      const major = match[1];
      const minor = match[2];
      const version = `${major}.${minor}`;
      const dateMatch = text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString();
      const titleMatch = text.match(/(\d+\.\d+)\s+패치\s+노트/);
      const title = titleMatch ? titleMatch[0] : `${version} 패치 노트`;

      patches.push({
        version,
        url: href.startsWith('http') ? href : `${TFT_BASE_URL}${href}`,
        date,
        title,
      });
    }
  });

  const uniquePatches = Array.from(new Map(patches.map((p) => [p.version, p])).values());
  uniquePatches.sort((a, b) => {
    const [aMajor, aMinor] = a.version.split('.').map(Number);
    const [bMajor, bMinor] = b.version.split('.').map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    return bMinor - aMinor;
  });

  return uniquePatches;
}
