import * as cheerio from 'cheerio';
import { PatchChangeParsed } from '../crawler/types'; // Correct import path
import { parseChangeLine, categorizeChange, determineOverallCategory, cleanText } from './utils';

export function parsePatchDetail(html: string): PatchChangeParsed[] {
  const $ = cheerio.load(html);
  const items: PatchChangeParsed[] = [];

  // Iterate over h3 elements (Items/Champions)
  $('h3.change-title').each((_, el) => {
    const $h3 = $(el);
    const name = cleanText($h3.text());
    
    // Determine category based on context or headers if possible.
    // For MVP, we might treat everything as 'champion' or generic 'item' if structure suggests.
    // The h3 usually sits under a section.
    // Let's default to 'champion' if it looks like a champion name, or 'item' otherwise.
    // Ideally we inspect the preceding H2.
    // For now, let's keep it simple: Just extract.
    
    // We need to look at siblings until next h3
    let next = $h3.next();
    const changes: { type: 'BUFF' | 'NERF' | 'ADJUST'; attribute: string; before: string; after: string }[] = [];
    
    let currentAbility = 'Base Stats'; // Default context

    while (next.length && next[0].tagName !== 'h3' && next[0].tagName !== 'h2') {
      if (next[0].tagName === 'h4') {
        currentAbility = cleanText(next.text());
      } else if (next[0].tagName === 'ul') {
          // Parse li
          next.find('li').each((_, li) => {
             const text = $(li).text();
             const parsed = parseChangeLine(text);
             if (parsed) {
                 const type = categorizeChange(parsed.attribute, parsed.before, parsed.after);
                 changes.push({
                     type,
                     attribute: `${currentAbility} - ${parsed.attribute}`,
                     before: parsed.before,
                     after: parsed.after
                 });
             }
          });
      }
      next = next.next();
    }
    
    if (changes.length > 0) {
        const itemType = determineOverallCategory(changes.map(c => c.type));
        
        items.push({
            name,
            category: 'unknown', // Todo: Improve categorization
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
  });

  return items;
}

function convertChangesToSummary(changes: { attribute: string; before: string; after: string }[]): string {
    return changes.map(c => `${c.attribute}: ${c.before} -> ${c.after}`).join('\n');
}
