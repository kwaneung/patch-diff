import * as cheerio from 'cheerio';
import { PatchChangeParsed } from '../crawler/types';
import {
  parseChangeLine,
  categorizeChange,
  determineOverallCategory,
  cleanText,
} from './utils';

/** Map TFT h4 subsection text to category. Uses h4 content (특성, 유닛, 아이템, 증강 등). */
function h4ToCategory(h4Text: string): string {
  const t = cleanText(h4Text).toLowerCase();
  if (/특성|trait/i.test(t)) return 'trait';
  if (/유닛|unit/i.test(t)) return 'unit';
  if (/아이템|item|핵심 아이템|유물|찬란한/i.test(t)) return 'item';
  if (/증강|augment/i.test(t)) return 'augment';
  return 'system';
}

export function parseTftPatchDetail(html: string): PatchChangeParsed[] {
  const $ = cheerio.load(html);
  const items: PatchChangeParsed[] = [];
  const $container = $('#patch-notes-container').length ? $('#patch-notes-container') : $.root();

  // TFT structure: h2 (체계 변경 사항, 대규모 변경 사항 등) > h4.change-detail-title (특성, 유닛, 아이템, 증강) > ul > li
  // Iterate h2 + h4 in document order, use h4 text for category (like LoL uses h2 for section)
  $container.find('h2, h4.change-detail-title').each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();

    if (tag === 'h2') return; // just track section, category comes from h4

    if (tag !== 'h4') return;

    const $h4 = $el;
    const h4Text = cleanText($h4.text());
    const category = h4ToCategory(h4Text);

    // Find content: next siblings until next h2/h4
    let next = $h4.next();
    const changes: {
      type: 'BUFF' | 'NERF' | 'ADJUST';
      attribute: string;
      before: string;
      after: string;
    }[] = [];

    while (next.length && next[0].tagName?.toLowerCase() !== 'h2' && next[0].tagName?.toLowerCase() !== 'h4') {
      if (next[0].tagName === 'ul' || next[0].tagName === 'ol') {
        next.find('li').each((_, li) => {
          const text = cleanText($(li).text());
          const parsed = parseChangeLine(text);
          if (parsed) {
            const type = categorizeChange(parsed.attribute, parsed.before, parsed.after);
            changes.push({
              type,
              attribute: parsed.attribute,
              before: parsed.before,
              after: parsed.after,
            });
          } else {
            const colonIdx = text.indexOf(':');
            if (colonIdx > 0) {
              const attr = text.substring(0, colonIdx).trim();
              const desc = text.substring(colonIdx + 1).trim();
              if (attr && desc) {
                changes.push({
                  type: 'ADJUST',
                  attribute: attr,
                  before: desc,
                  after: '',
                });
              }
            }
          }
        });
      }
      next = next.next();
    }

    // Group changes by name (first part before common attribute keywords)
    const byName = new Map<string, typeof changes>();
    for (const c of changes) {
      const name = extractTftName(c.attribute, category);
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(c);
    }

    for (const [name, attrs] of byName) {
      const itemType = determineOverallCategory(attrs.map((a) => a.type));
      items.push({
        name,
        category,
        changeType: itemType,
        attributes: attrs.map((a) => ({
          name: a.attribute,
          changeType: a.type,
          before: a.before,
          after: a.after,
        })),
        summary: attrs.map((a) => `${a.attribute}: ${a.before} -> ${a.after}`).join('\n'),
      });
    }
  });

  return items;
}

/** Extract display name from TFT attribute. For units: first word; for traits/items: full or first segment. */
function extractTftName(attribute: string, category: string): string {
  const trimmed = cleanText(attribute);
  if (category === 'unit') {
    const firstSpace = trimmed.indexOf(' ');
    return firstSpace > 0 ? trimmed.substring(0, firstSpace) : trimmed;
  }
  if (category === 'trait' || category === 'augment') {
    const colon = trimmed.indexOf(':');
    return colon > 0 ? trimmed.substring(0, colon).trim() : trimmed;
  }
  const firstSpace = trimmed.indexOf(' ');
  return firstSpace > 0 ? trimmed.substring(0, firstSpace) : trimmed;
}
