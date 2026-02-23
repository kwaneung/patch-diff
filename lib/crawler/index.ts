import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { PatchListUrl } from "./types";

const BASE_URL = "https://www.leagueoflegends.com";
const TFT_BASE_URL = "https://teamfighttactics.leagueoflegends.com";
const GAME_UPDATES_URL =
  "https://www.leagueoflegends.com/ko-kr/news/game-updates/";

/** Init 크롤 시 "더 보기" 버튼 클릭 횟수. */
const INIT_LOAD_MORE_CLICKS = 5;

export interface PatchLinksByMode {
  lol: PatchListUrl[];
  tft: PatchListUrl[];
}

function sortPatchesByVersion(patches: PatchListUrl[]): PatchListUrl[] {
  const unique = Array.from(
    new Map(patches.map((p) => [p.version, p])).values(),
  );
  unique.sort((a, b) => {
    const [aMajor, aMinor] = a.version.split(".").map(Number);
    const [bMajor, bMinor] = b.version.split(".").map(Number);
    if (aMajor !== bMajor) return bMajor - aMajor;
    return bMinor - aMinor;
  });
  return unique;
}

/** 텍스트에서 날짜 추출. UTC ISO 문자열 반환 (timestamptz 저장용). */
function extractDate(text: string): string | null {
  // 1) ISO: 2026-02-18T19:00:00.000Z (또는 .123Z 등) - 그대로 반환
  const iso = text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)/);
  if (iso) return iso[1];

  // 2) 한국 형식: 2026. 2. 19. (KST) → UTC로 변환
  // Riot 패치: 19:00 UTC = 다음날 04:00 KST. KST D일 표시 = UTC (D-1)일 19:00
  const kr = text.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
  if (kr) {
    const [, y, m, d] = kr;
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0));
    date.setUTCDate(date.getUTCDate() - 1);
    date.setUTCHours(19, 0, 0, 0);
    return date.toISOString();
  }
  return null;
}

function toPatchEntry(
  href: string,
  text: string,
  major: string,
  minor: string,
  baseUrl: string,
  titleSuffix: string,
): PatchListUrl {
  const version = `${major}.${minor}`;
  const date = extractDate(text);
  const titleMatch = text.match(/(\d+\.\d+)\s+패치\s+노트/);
  const title = titleMatch ? titleMatch[0] : `${version} ${titleSuffix}`;
  const url = href.startsWith("http") ? href : `${baseUrl}${href}`;

  return { version, url, date, title };
}

async function fetchHtmlWithLoadMore(clicks: number): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(GAME_UPDATES_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    for (let i = 0; i < clicks; i++) {
      const button = page.locator('button.cta:has-text("더 보기")');
      const count = await button.count();
      if (count === 0) break;
      await button.first().click();
      await page.waitForTimeout(1500);
    }
    return await page.content();
  } finally {
    await browser.close();
  }
}

function parsePatchLinksFromHtml(html: string): PatchLinksByMode {
  const $ = cheerio.load(html);

  const lolPatches: PatchListUrl[] = [];
  const tftPatches: PatchListUrl[] = [];

  $("a").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const text = $el.text();

    if (!href) return;

    // Exclude non-patch links
    if (/youtube\.com|youtu\.be/i.test(href)) return;
    if (/lunar|revel|시네마틱|트레일러|설맞이|대잔치|야수의 축제/i.test(text))
      return;

    // TFT: teamfight-tactics-patch-* (leagueoflegends.com or teamfighttactics domain)
    const tftMatch = href.match(
      /\/ko-kr\/news\/game-updates\/teamfight-tactics-patch-(\d+)-(\d+)/,
    );
    if (tftMatch) {
      tftPatches.push(
        toPatchEntry(
          href,
          text,
          tftMatch[1],
          tftMatch[2],
          TFT_BASE_URL,
          "패치 노트",
        ),
      );
      return;
    }

    // LoL: league-of-legends-patch-* or patch-*-notes (leagueoflegends.com only)
    const lolMatch = href.match(
      /\/ko-kr\/news\/game-updates\/(?:league-of-legends-)?patch-(\d+)-(\d+)-notes/,
    );
    if (lolMatch && !/teamfight-tactics|tft/i.test(href)) {
      lolPatches.push(
        toPatchEntry(
          href,
          text,
          lolMatch[1],
          lolMatch[2],
          BASE_URL,
          "패치 노트",
        ),
      );
    }
  });

  return {
    lol: sortPatchesByVersion(lolPatches),
    tft: sortPatchesByVersion(tftPatches),
  };
}

/**
 * Fetches the unified game-updates page and extracts LoL + TFT patch links.
 * Single entry point per requirements-phase3.md §1.
 * Append용 크론: 초기 HTML만 사용.
 */
export async function fetchAllPatchLinks(): Promise<PatchLinksByMode> {
  const response = await fetch(GAME_UPDATES_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch game-updates: ${response.status} ${response.statusText}`,
    );
  }
  const html = await response.text();
  return parsePatchLinksFromHtml(html);
}

/**
 * Init용: Playwright로 "더 보기" 3회 클릭 후 전체 패치 링크 수집.
 * DB truncate 후 수동 초기화 시에만 사용. 로컬 실행 권장.
 */
export async function fetchAllPatchLinksForInit(): Promise<PatchLinksByMode> {
  const html = await fetchHtmlWithLoadMore(INIT_LOAD_MORE_CLICKS);
  return parsePatchLinksFromHtml(html);
}

/** @deprecated Use fetchAllPatchLinks().lol instead. Kept for backward compatibility during migration. */
export async function fetchPatchList(): Promise<PatchListUrl[]> {
  const { lol } = await fetchAllPatchLinks();
  return lol;
}

/** @deprecated Use fetchAllPatchLinks().tft instead. Kept for backward compatibility during migration. */
export async function fetchTftPatchList(): Promise<PatchListUrl[]> {
  const { tft } = await fetchAllPatchLinks();
  return tft;
}
