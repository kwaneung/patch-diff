# PatchDiff.gg

리그 오브 레전드 패치노트를 **해석·평가 없이** 변화(diff)만 구조화해 보여주는 서비스입니다. 상향·하향·조정을 명확한 규칙으로 분류하고, 패치 버전·모드별로 빠르게 탐색할 수 있습니다.

## Links

| | |
|---|---|
| **Live** | https://patch-diff.vercel.app |
| **Repository** | https://github.com/kwaneung/patch-diff |

## Highlights

- **크롤링** — Riot [게임 업데이트](https://www.leagueoflegends.com/ko-kr/news/game-updates/) 목록 수집, **Vercel Cron** (`/api/crawl`, 매일)으로 신규 패치 append
- **파싱** — cheerio 기반 상세 파싱, `BUFF` / `NERF` / `ADJUST` 분류
- **모드** — 소환사의 협곽, TFT, 증바람(ARAM Mayhem, LoL 패치 내 섹션 추출)
- **UI** — 패치 카드 목록(버전 **내림차순**), 상세 필터·검색, 변경 항목 diff 표시
- **데이터** — Supabase(Postgres), `use cache` + `cacheTag`로 목록·상세 캐시
- **문서** — `docs/requirements-phase1~3.md` (MVP → 검색·모드 확장 로드맵)

## Stack

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript, React Compiler |
| UI | Tailwind CSS v4, shadcn/ui, Base UI |
| Data | Supabase (`patches`, `patch_items`, `patch_changes`, `crawler_runs`) |
| Crawl | cheerio, Playwright(init 전용·로컬), Vercel Cron |
| Deploy | Vercel |

## Features

| 영역 | 설명 |
|------|------|
| 홈 | 모드별 최신 패치 카드, 통합 검색 진입 |
| `/patches/[version]` | 챔피언·아이템·시스템 변경, 유형·카테고리 필터 |
| `/search` | 여러 패치에 걸친 챔피언/항목 검색 |
| Cron | 신규 버전만 상세 fetch 후 DB 저장 |

## Project structure

```
app/                    # App Router (홈, patches, search, api/crawl)
components/             # PatchCard, PatchDetailView, filters
lib/
  crawler/              # game-updates 목록·저장
  parser/               # LoL, TFT, ARAM Mayhem
  data/                 # getPatches, search (캐시)
  patch-version.ts      # 시맨틱 버전 정렬 (26.11 > 26.9)
supabase/migrations/
docs/                   # 요구사항·SDD
scripts/                # 파서·크롤러 수동 테스트
```

## Local development

### Requirements

- Node.js 20+
- pnpm
- Supabase 프로젝트

### Setup

```bash
git clone https://github.com/kwaneung/patch-diff.git
cd patch-diff
pnpm install
```

`.env.local` 예시:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

```bash
pnpm dev    # http://localhost:3000
pnpm build
```

### Crawling (로컬)

**Append** — 크론과 동일(초기 HTML만, 신규 패치만):

```bash
curl -X GET "http://localhost:3000/api/crawl" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Init** — DB 초기화 후 전체 수집(Playwright `더 보기`, **로컬 전용**):

```bash
npx playwright install chromium
curl -X GET "http://localhost:3000/api/crawl/init" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Deployment

- `vercel.json` — `0 0 * * *` → `/api/crawl`
- Production에 `CRON_SECRET`, Supabase 키 설정 필요
- Vercel 대시보드 **Cron Jobs**에서 invocation·로그 확인

## Documentation

- [Phase 1 — MVP](./docs/requirements-phase1.md)
- [Phase 2](./docs/requirements-phase2.md)
- [Phase 3](./docs/requirements-phase3.md)

## Status

| | |
|---|---|
| **Period** | 2026-02 ~ |
| **Maintenance** | 개인 사이드 프로젝트 · 필요 시 크롤/파서 보수 |
| **License** | 포트폴리오 참고용 (별도 LICENSE 없음) |
