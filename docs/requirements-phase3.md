# PatchDiff.gg – Phase 3 구현 계획 (v1.0)

Phase 2 완료 후 진행할 기능에 대한 구현 계획입니다.

---

## Phase 2 완료 요약

- ✅ 카테고리 필터, 패치 상세 검색, 카테고리 표시 개선
- ✅ TFT 지원 (크롤러, 파서, 모드 선택 UI)
- ✅ 크롤러 메타데이터 (`crawler_runs`)
- ⏸️ 관리자 페이지: 불필요 (Supabase DB 직접 확인)
- ⏸️ UI/UX 개선: Phase 3로 이관

---

## Phase 3 목표

1. **크롤러 단일 진입점 리팩토링**: `game-updates` 페이지를 LoL/TFT 공통 진입점으로 통합
2. **전체 패치 통합 검색**: 여러 패치에 걸쳐 챔피언/아이템 변경 이력 조회
3. **UI/UX 개선**: 디자인 정리 및 반응형 재점검
4. **(선택) 증바람 (무작위 총력전: 아수라장)**: LoL 패치 내 아수라장 섹션 추출·별도 모드 표시

---

## 1. 크롤러 단일 진입점 리팩토링

### 1.1 배경

- 현재: LoL은 `tags/patch-notes/`, TFT는 `teamfighttactics.leagueoflegends.com/game-updates/` 각각 별도 크롤
- 요구: [게임 업데이트](https://www.leagueoflegends.com/ko-kr/news/game-updates/) 페이지에 LoL·TFT·기타 모드 패치가 통합 노출되므로, 이를 단일 진입점으로 사용

### 1.2 요구사항

| 항목 | 내용 |
|------|------|
| 단일 URL | `https://www.leagueoflegends.com/ko-kr/news/game-updates/` |
| 파싱 대상 | LoL 패치 링크, TFT 패치 링크 (URL 패턴으로 구분) |
| 제외 | Lunar Revel, 시네마틱 등 패치가 아닌 게시물 링크 |

### 1.3 구현 계획

#### 1.3.1 URL 패턴

- **LoL**: `league-of-legends-patch-*` 또는 `patch-*-notes` (lol 도메인)
- **TFT**: `teamfight-tactics-patch-*` (상세 URL은 `teamfighttactics.leagueoflegends.com` 도메인)

#### 1.3.2 리팩토링 작업

- [ ] `lib/crawler/index.ts`: `game-updates` 단일 fetch 함수 추가 또는 기존 `fetchPatchList`/`fetchTftPatchList`를 통합
- [ ] 모드별로 링크 필터링하여 `{ lol: PatchListUrl[], tft: PatchListUrl[] }` 등 형태로 반환
- [ ] `lib/crawler/save.ts`: 통합 목록에서 모드별로 분기하여 상세 크롤 + 파싱 (기존 `parsePatchDetail`, `parseTftPatchDetail` 유지)
- [ ] 기존 `tags/patch-notes` URL 및 TFT 전용 `LIST_URL` 제거

#### 1.3.3 무한 스크롤 대응

- **현황**: [게임 업데이트](https://www.leagueoflegends.com/ko-kr/news/game-updates/) 페이지는 "더 보기" 클릭 시 무한 스크롤로 추가 로드됨
- **검증 결과** (2026-02 기준): 초기 로드·추가 로드 항목 모두 **LoL 패치, TFT 패치, 이벤트/시네마틱**만 포함. LoR(playruneterra.com), Valorant(valorant.com) 등 타 Riot 게임은 별도 사이트에 있어 이 페이지에 노출되지 않음
- **구현 시**: 무한 스크롤 API(cursor/offset 등) 여부 조사. 없으면 초기 HTML만 파싱하거나 headless 브라우저로 "더 보기" 트리거 후 HTML 수집 검토

#### 1.3.4 검증

- [ ] game-updates 페이지 HTML 구조 확인 (링크 셀렉터, 무한 스크롤 트리거 방식)
- [ ] LoL/TFT 패치 수가 기존 크롤 결과와 동일한지 비교

### 1.4 의존성

- 상세 HTML 파싱(`parsePatchDetail`, `parseTftPatchDetail`)은 변경 없음
- `patches`, `patch_items`, `patch_changes` 스키마 변경 없음

---

## 2. 전체 패치 통합 검색

### 2.1 배경

- 현재: 패치 상세 페이지 내 검색만 지원 (단일 패치 내 필터링)
- 요구: "아트록스" 검색 시 **모든 패치**에서 아트록스 변경사항 조회

### 2.2 요구사항

| 항목 | 내용 |
|------|------|
| 검색 대상 | 챔피언명, 아이템명, 특성명, 유닛명 등 |
| 검색 범위 | 선택한 게임 모드의 **전체 패치** (또는 최근 N개) |
| 결과 표시 | 패치별로 그룹핑, 각 패치 내 변경 내용 노출 |

### 2.3 구현 계획

#### 2.3.1 API / 데이터

- **검색 API**: `GET /api/search?q=아트록스&mode=summoners-rift`
  - Supabase `patch_items` + `patch_changes` 조인 검색
  - `name`, `attribute`, `description` 등 `ilike` 검색
- **캐시**: `cacheTag('search-{mode}', 'search-{mode}-{query}')`, `cacheLife('hours')` (§6.2 정책 준수)

#### 2.3.2 라우팅

- **검색 전용 페이지**: `/search` 또는 `/?q=아트록스` (쿼리 파라미터)
- 메인 화면 중앙에 검색 input 배치 → 검색 시 전용 화면으로 이동

#### 2.3.3 UI

- **메인 화면**: 구글 홈처럼 중앙 검색 input (패치 목록 위 또는 대체)
- **검색 결과 화면**:
  - 검색어 + 모드 표시
  - 결과를 패치 버전별로 그룹핑 (카드 또는 아코디언)
  - 각 항목: 이름, 카테고리, 변경 유형, 변경 내용 요약

### 2.4 의존성

- DB `patch_items`, `patch_changes` 구조 유지
- `game_mode`(games 테이블) 기준으로 검색 범위 제한

---

## 3. UI/UX 개선

### 3.1 배경

- Phase 2에서 기능 구현에 집중, 디자인·반응형은 후순위로 미룸

### 3.2 요구사항

| 항목 | 내용 |
|------|------|
| 디자인 시스템 | **shadcn/ui** 기반으로 점진적 구축 |
| 디자인 컨셉 | 톤앤매너, 색상, 타이포그래피 정리 |
| 반응형 | 모바일 / 태블릿 / 데스크탑 브레이크포인트 재점검 |
| 접근성 | 키보드 네비게이션, 스크린 리더 등 (선택) |

### 3.3 구현 계획

#### 3.3.1 디자인

- [ ] **shadcn/ui** 기반 컴포넌트 확장, 기존 UI 점진 교체
- [ ] 디자인 토큰 (색상/폰트/간격)을 Tailwind/globals.css에 정리

#### 3.3.2 반응형

- [ ] 모바일: 필터·검색 UI 축소, 카드 레이아웃 1열
- [ ] 태블릿: 2열 그리드, 필터 영역 가독성
- [ ] 데스크탑: 3열 그리드, 여백·가독성 최적화

#### 3.3.3 우선순위

- 반응형 재점검을 먼저 진행 (기능 동작 보장)
- 디자인 컨셉은 점진적으로 적용

---

## 4. 증바람 (무작위 총력전: 아수라장) (선택)

### 4.1 배경

- **무작위 총력전: 아수라장**은 별도 URL이 아님. LoL 패치노트 **내부 섹션**으로 포함됨
- 예: [26.3 패치 노트](https://www.leagueoflegends.com/ko-kr/news/game-updates/patch-26-3-notes/)에 "무작위 총력전: 아수라장" 항목이 포함됨 (증강, 증강 세트, 밸런스 변경 등)
- 요구: LoL 패치에서 이 섹션을 파싱·추출하여 **LoL, TFT, 증바람** 3개 모드로 표시

### 4.2 요구사항

| 항목 | 내용 |
|------|------|
| 데이터 소스 | LoL 패치 상세 HTML (별도 크롤 불필요) |
| 파싱 대상 | "무작위 총력전: 아수라장" h2/h3 섹션 및 하위 콘텐츠 (증강, 증강 세트, 밸런스 변경 등) |
| 모드 구분 | LoL(소환사의 협곡), TFT, 증바람(ARAM Mayhem) 3개로 UI 표시 |

### 4.3 구현 계획

#### 4.3.1 파서 확장

- [ ] `lib/parser/index.ts` (또는 LoL 파서): LoL 패치 상세 HTML에서 "무작위 총력전: 아수라장" 섹션 추출
- [ ] 추출된 내용을 `patch_items`/`patch_changes`에 저장 (`game_id` = `aram-mayhem` 또는 `category`로 구분)
- [ ] 아수라장 전용 구조: 증강명, 증강 세트, 밸런스 변경 등 파싱 규칙 정의

#### 4.3.2 DB·라우팅

- [ ] `games` 테이블에 `aram-mayhem` 슬러그 추가 (공식명 ARAM Mayhem, 한국어 무작위 총력전: 아수라장)
- [ ] 패치 버전과 LoL 동기화 (같은 LoL 패치 = 같은 증바람 패치)

#### 4.3.3 UI

- [ ] 모드 선택: **LoL** | **TFT** | **증바람** 3개 탭/드롭다운
- [ ] 증바람 선택 시: 해당 LoL 패치에서 추출한 아수라장 콘텐츠만 노출

### 4.4 참고

- 별도 URL·크롤러 불필요. LoL 패치 크롤 시 아수라장 섹션만 추가 파싱하여 저장
- **우선순위**: §1~§3 이후 검토

---

## 5. 권장 구현 순서

```
1. 크롤러 단일 진입점 리팩토링 (§1)
   - game-updates 페이지 파싱 통합
   - fetchPatchList / fetchTftPatchList → 단일 fetch 후 모드별 분리

2. 전체 패치 통합 검색 (§2)
   - 검색 API + 검색 결과 페이지
   - 메인 화면 검색 input

3. UI/UX 개선 (§3)
   - 반응형 재점검
   - 디자인 정리 (점진적)

4. (선택) 증바람 (§4): LoL 패치 내 아수라장 섹션 추출·별도 모드 표시
```

---

## 6. 기술 고려사항

### 6.1 검색 성능

- 패치 수 증가 시 `ilike` 검색 비용 고려
- 필요 시 `patch_items.name` 등에 GIN 인덱스 또는 Full-Text Search 검토

### 6.2 use cache 정책

Phase 3에서 `use cache` 사용 시 준수할 규칙:

| 대상 | cacheTag | cacheLife | 비고 |
|------|----------|-----------|------|
| 패치 목록 | `patches-{mode}` | `hours` | 기존 유지 |
| 패치 상세 | `patches-{mode}`, `patch-{mode}-{version}` | `hours` | 기존 유지 |
| 검색 결과 | `search-{mode}`, `search-{mode}-{query}` | `hours` | 부모 태그로 일괄 무효화 가능 |
| 검색 API/ fetcher | 동일 | 동일 | Server Component 또는 Server Action에서 `'use cache'` |

- **캐시 무효화**: 크롤 완료 시 `revalidateTag('patches-{mode}')` 호출. 검색 캐시는 `search-{mode}` 태그로 묶어 두고, 패치 크롤 시 `revalidateTag('search-' + mode)` 추가로 동일 모드 검색 결과 갱신.
- **일관성**: 신규 fetcher는 반드시 `cacheTag`, `cacheLife` 명시.

### 6.3 기존 코드 영향

- **크롤러** (`lib/crawler/`, `app/api/crawl/route.ts`): §1 단일 진입점 리팩토링, 크롤 완료 시 §6.2에 따른 검색 캐시 무효화 적용
- `lib/data/patches.ts`: 검색용 fetcher 추가 (`use cache` + `cacheTag`/`cacheLife` 적용)
- `app/page.tsx`: 검색 input 추가 시 레이아웃 조정
- 새 라우트: `app/search/page.tsx` 또는 `app/(main)/search/page.tsx`

---

## 7. 체크리스트 (구현 시 참고)

### §1 크롤러 단일 진입점 리팩토링

- [ ] `lib/crawler/index.ts`: game-updates 단일 fetch + 모드별 링크 분리
- [ ] `lib/crawler/save.ts`: 통합 목록 기반 모드별 크롤 연결
- [ ] 기존 `tags/patch-notes`, TFT 전용 LIST_URL 제거
- [ ] LoL/TFT 패치 수 검증 (기존 대비)
- [ ] 크롤 완료 시 캐시 무효화 (§6.2: `patches-{mode}`, §2 구현 시 `search-{mode}`)

### §2 전체 패치 통합 검색

- [ ] `GET /api/search` 또는 Server Action 검색 함수
- [ ] `app/search/page.tsx` 검색 결과 페이지
- [ ] 메인 화면 검색 input + 검색 페이지 이동
- [ ] 패치별 그룹핑 UI
- [ ] 모드별 검색 범위 적용
- [ ] 캐시 태그·무효화 전략 (§6.2 use cache 정책)

### §3 UI/UX 개선

- [ ] shadcn/ui 기반 컴포넌트 확장·점진 교체
- [ ] 모바일/태블릿/데스크탑 레이아웃 점검
- [ ] 디자인 토큰 또는 스타일 가이드 정리
- [ ] 필터·카드 등 컴포넌트 반응형 개선

### §4 증바람 (선택)

- [ ] LoL 파서: "무작위 총력전: 아수라장" 섹션 추출 로직
- [ ] `games` 테이블에 `aram-mayhem` 모드 추가
- [ ] 모드 선택 UI: LoL | TFT | 증바람 3개

---

> **작성일**: 2026-02-22  
> **기준**: Phase 2 완료, 대화 내용 반영
