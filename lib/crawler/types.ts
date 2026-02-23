export interface PatchListUrl {
  version: string;
  url: string;
  date: string | null; // game-updates 카드 ISO 추출 실패 시 null
  title: string;
}

export interface PatchDetail {
  version: string;
  title: string;
  date: string;
  htmlContent: string;
}

// Internal types for parser
export type ChangeType = 'BUFF' | 'NERF' | 'ADJUST';

export interface PatchChangeParsed {
  name: string;
  category: string; // 'champion', 'item', 'system'
  changeType: ChangeType;
  attributes: {
    name: string;
    changeType: ChangeType;
    before: string | null;
    after: string | null;
  }[];
  summary: string;
}
