import * as cheerio from 'cheerio';
import { PatchChangeParsed } from '../crawler/types'; // Correct import path
import { parseChangeLine, categorizeChange, determineOverallCategory, cleanText } from './utils';

/** Map h2 section text to category. Supports Korean and English. */
function sectionToCategory(sectionText: string): 'champion' | 'item' | 'system' {
  const t = cleanText(sectionText).toLowerCase();
  if (/챔피언|champion/i.test(t)) return 'champion';
  if (/아이템|item/i.test(t)) return 'item';
  return 'system';
}

/** Check if section uses h4 as top-level entries (items, system, summoner spells, etc.) */
function sectionUsesH4Entries(sectionText: string): boolean {
  const t = cleanText(sectionText).toLowerCase();
  if (/챔피언|champion/i.test(t)) return false;
  return true;
}

function parseEntryFromSiblings(
  $: cheerio.CheerioAPI,
  $start: cheerio.Cheerio<cheerio.Element>,
  stopTags: string[],
  isChampionStyle: boolean
): { changes: { type: 'BUFF' | 'NERF' | 'ADJUST'; attribute: string; before: string; after: string }[] } {
  let next = $start.next();
  const changes: { type: 'BUFF' | 'NERF' | 'ADJUST'; attribute: string; before: string; after: string }[] = [];
  let currentAbility = 'Base Stats';

  while (next.length && !stopTags.includes(next[0].tagName?.toLowerCase() || '')) {
    const tag = next[0].tagName?.toLowerCase();
    if (tag === 'h4') {
      currentAbility = cleanText(next.text());
    } else if (tag === 'ul') {
      next.find('li').each((_, li) => {
        const text = $(li).text();
        const parsed = parseChangeLine(text);
        if (parsed) {
          const type = categorizeChange(parsed.attribute, parsed.before, parsed.after);
          changes.push({
            type,
            attribute: isChampionStyle ? `${currentAbility} - ${parsed.attribute}` : parsed.attribute,
            before: parsed.before,
            after: parsed.after
          });
        }
      });
    }
    next = next.next();
  }
  return { changes };
}

export function parsePatchDetail(html: string): PatchChangeParsed[] {
  const $ = cheerio.load(html);
  const items: PatchChangeParsed[] = [];

  let currentSection = '';
  const $container = $('#patch-notes-container').length ? $('#patch-notes-container') : $.root();
  const stopTags = ['h2', 'h3', 'h4'];

  // Champions: h2 > h3.change-title (name) > h4 (ability) > ul > li
  // Items/System: h2 > h4.change-detail-title (name) > ul > li  (no h3)
  $container.find('h2, h3.change-title, h4.change-detail-title').each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();

    if (tag === 'h2') {
      currentSection = cleanText($el.text());
      return;
    }

    if (tag === 'h3') {
      // Champion-style: h3 = entry name
      const name = cleanText($el.text());
      const category = sectionToCategory(currentSection);
      const { changes } = parseEntryFromSiblings($, $el, ['h2', 'h3'], true);

      if (changes.length > 0) {
        const itemType = determineOverallCategory(changes.map(c => c.type));
        items.push({
          name,
          category,
          changeType: itemType,
          attributes: changes.map(c => ({
            name: c.attribute,
            changeType: c.type,
            before: c.before,
            after: c.after
          })),
          summary: convertChangesToSummary(changes)
        });
      }
      return;
    }

    if (tag === 'h4' && sectionUsesH4Entries(currentSection)) {
      // Items/System: h4 = entry name (or h4 "아이템" + strong "마법광학 장치 C44" in Arena)
      let name = cleanText($el.text());
      const $next = $el.next();
      if ($next.length && $next[0].tagName?.toLowerCase() === 'strong') {
        const strongText = cleanText($next.text());
        if (strongText && (name === '아이템' || name === 'Item' || !name)) name = strongText;
      }
      if (!name) return;

      const category = sectionToCategory(currentSection);
      const { changes } = parseEntryFromSiblings($, $el, ['h2', 'h3', 'h4'], false);

      if (changes.length > 0) {
        const itemType = determineOverallCategory(changes.map(c => c.type));
        items.push({
          name,
          category,
          changeType: itemType,
          attributes: changes.map(c => ({
            name: c.attribute,
            changeType: c.type,
            before: c.before,
            after: c.after
          })),
          summary: convertChangesToSummary(changes)
        });
      }
    }
  });

  return items;
}

function convertChangesToSummary(changes: { attribute: string; before: string; after: string }[]): string {
    return changes.map(c => `${c.attribute}: ${c.before} -> ${c.after}`).join('\n');
}
