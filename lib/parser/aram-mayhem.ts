import * as cheerio from 'cheerio';
import { PatchChangeParsed } from '../crawler/types';
import {
  parseChangeLine,
  categorizeChange,
  determineOverallCategory,
  cleanText,
} from './utils';

function isAramMayhemHeading(text: string): boolean {
  const t = cleanText(text);
  return /무작위 총력전.*아수라장|아수라장.*진척도|아수라장.*세트|아수라장.*버그|증강 세트|증강 밸런스|편의성 개선/.test(t);
}

function isAramMayhemH2(text: string, id: string): boolean {
  return id === 'patch-aram-mayhem' || /무작위 총력전: 아수라장/.test(cleanText(text));
}

function subsectionToCategory(subsectionText: string): string {
  const t = cleanText(subsectionText).toLowerCase();
  if (/증강.*세트|세트.*변경/.test(t)) return 'augment_set';
  if (/진척도|트랙/.test(t)) return 'progress_track';
  if (/밸런스/.test(t)) return 'augment';
  if (/버그|수정/.test(t)) return 'bugfix';
  if (/편의성/.test(t)) return 'system';
  return 'augment';
}

/**
 * LoL 패치 HTML에서 "무작위 총력전: 아수라장" 섹션만 추출하여 PatchChangeParsed[] 반환.
 * 별도 URL 없음 - LoL 패치 내부 섹션.
 */
export function parseAramMayhemFromLolPatch(html: string): PatchChangeParsed[] {
  const $ = cheerio.load(html);
  const items: PatchChangeParsed[] = [];

  const $allHeadings = $('#patch-notes-container').length
    ? $('#patch-notes-container').find('h2, h4.change-detail-title')
    : $('h2, h4.change-detail-title');

  let insideAramMayhem = false;
  const seenSections = new Set<string>();

  for (let i = 0; i < $allHeadings.length; i++) {
    const $el = $allHeadings.eq(i);
    const tag = $el[0]?.tagName?.toLowerCase();
    const text = cleanText($el.text());

    if (tag === 'h2') {
      if (isAramMayhemH2(text, $el.attr('id') || '')) {
        insideAramMayhem = true;
        continue;
      }
      if (insideAramMayhem) break;
      continue;
    }

    const isAramH4 = isAramMayhemHeading(text) || (insideAramMayhem && text.length > 0);
    if (tag === 'h4' && isAramH4) {
      const sectionKey = text.slice(0, 50);
      if (seenSections.has(sectionKey)) continue;
      seenSections.add(sectionKey);

      const currentSubsection = text;
      const changes: { type: 'BUFF' | 'NERF' | 'ADJUST'; attribute: string; before: string; after: string }[] = [];
      let next = $el.next();

      while (next.length) {
        const nextTag = next[0]?.tagName?.toLowerCase();
        if (nextTag === 'h2' || (nextTag === 'h4' && next.hasClass('change-detail-title'))) {
          break;
        }
        if (nextTag === 'ul') {
          next.find('li').each((_, li) => {
            const liText = $(li).text();
            const parsed = parseChangeLine(liText);
            if (parsed) {
              const type = categorizeChange(parsed.attribute, parsed.before, parsed.after);
              changes.push({
                type,
                attribute: parsed.attribute,
                before: parsed.before,
                after: parsed.after,
              });
            } else if (liText.trim()) {
              const desc = liText.trim();
              changes.push({
                type: 'ADJUST',
                attribute: desc.slice(0, 60) + (desc.length > 60 ? '…' : ''),
                before: '',
                after: desc,
              });
            }
          });
        }
        next = next.next();
      }

      if (changes.length > 0) {
        const itemType = determineOverallCategory(changes.map((c) => c.type));
        items.push({
          name: currentSubsection,
          category: subsectionToCategory(currentSubsection),
          changeType: itemType,
          attributes: changes.map((c) => ({
            name: c.attribute,
            changeType: c.type,
            before: c.before,
            after: c.after,
          })),
          summary: changes.map((c) => `${c.attribute}: ${c.before} -> ${c.after}`).join('\n'),
        });
      }
    }
  }

  return items;
}
