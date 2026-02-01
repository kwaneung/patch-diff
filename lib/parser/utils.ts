import { ChangeType } from '../crawler/types';

// Attributes where INCREASE is BAD (Nerf)
const NEGATIVE_ATTRIBUTES = [
  '재사용 대기시간',
  '마나 소모량',
  '기력 소모량',
  '체력 소모량',
  '비용',
  '충전 시간',
  '둔화율', // Context dependent, but usually higher slow on self is bad? No, usually 'Slow Amount' refers to effect on enemy.
  // Wait, 'Slow Amount: 30% -> 40%' is GOOD (Buff) for the user.
  // 'Self Slow': BAD.
  // Let's stick to obvious ones.
];

// Attributes where INCREASE is usually GOOD (Buff)
// Default assumption is Increase = Good, unless in Negative list.

// Helper to clean text
export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function parseChangeLine(line: string): { attribute: string; before: string; after: string } | null {
  // Common patterns:
  // "Attribute: Before -> After"
  // "Attribute: Before ⇒ After"
  // "Attribute: Before => After"
  
  // Split by first colon
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;

  const attribute = cleanText(line.substring(0, colonIndex));
  const values = line.substring(colonIndex + 1);

  // Split by arrow
  const arrowMatch = values.match(/(→|⇒|=>|->)/);
  if (!arrowMatch) return null;

  const arrow = arrowMatch[0];
  const [before, after] = values.split(arrow);

  return {
    attribute,
    before: cleanText(before),
    after: cleanText(after),
  };
}

export function categorizeChange(attribute: string, before: string, after: string): ChangeType {
  // Handle slash separated values (e.g. 10/20/30)
  const hasSlash = before.includes('/') || after.includes('/');
  
  if (hasSlash) {
    const beforeParts = before.split('/').map(p => parseFloat(p.replace(/[^0-9.-]/g, '')));
    const afterParts = after.split('/').map(p => parseFloat(p.replace(/[^0-9.-]/g, '')));
    
    // If mismatch length, assume structural change -> Adjust
    if (beforeParts.length !== afterParts.length) return 'ADJUST';
    
    let allIncrease = true;
    let allDecrease = true;
    
    for (let i = 0; i < beforeParts.length; i++) {
        if (isNaN(beforeParts[i]) || isNaN(afterParts[i])) return 'ADJUST';
        if (afterParts[i] <= beforeParts[i]) allIncrease = false;
        if (afterParts[i] >= beforeParts[i]) allDecrease = false;
    }

    const isNegativeAttr = NEGATIVE_ATTRIBUTES.some(neg => attribute.includes(neg));
    
    if (allIncrease) return isNegativeAttr ? 'NERF' : 'BUFF';
    if (allDecrease) return isNegativeAttr ? 'BUFF' : 'NERF';
    return 'ADJUST';
  }

  // Simple number extraction for comparison
  const beforeNum = parseFloat(before.replace(/[^0-9.-]/g, ''));
  const afterNum = parseFloat(after.replace(/[^0-9.-]/g, ''));

  if (isNaN(beforeNum) || isNaN(afterNum)) {
    return 'ADJUST';
  }

  const isIncrease = afterNum > beforeNum;
  const isDecrease = afterNum < beforeNum;
  
  if (!isIncrease && !isDecrease) return 'ADJUST'; // Same numbers?

  const isNegativeAttr = NEGATIVE_ATTRIBUTES.some(neg => attribute.includes(neg));

  if (isNegativeAttr) {
    return isIncrease ? 'NERF' : 'BUFF';
  } else {
    return isIncrease ? 'BUFF' : 'NERF';
  }
}

export function determineOverallCategory(changes: ChangeType[]): ChangeType {
    if (changes.length === 0) return 'ADJUST';
    
    const hasBuff = changes.includes('BUFF');
    const hasNerf = changes.includes('NERF');
    const hasAdjust = changes.includes('ADJUST');

    if (hasAdjust) return 'ADJUST';
    if (hasBuff && hasNerf) return 'ADJUST';
    if (hasBuff) return 'BUFF';
    if (hasNerf) return 'NERF';
    
    return 'ADJUST';
}
