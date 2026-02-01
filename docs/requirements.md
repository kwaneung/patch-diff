# PatchDiff.gg – 요구사항 명세서 (MVP)

## 1. 서비스 개요

### 1.1 서비스 목적
PatchDiff.gg는 게임 패치노트를 **해석하거나 평가하지 않고**,  
패치 전·후의 **변화(diff)** 를 구조화하여 한눈에 보여주는 서비스다.

- 상향 / 하향 / 조정을 **명확한 기준으로만 분류**
- 애매한 경우는 **무조건 ‘조정’** 으로 처리
- 사용자가 빠르게 “무엇이 바뀌었는지” 파악하는 데 집중

---

### 1.2 MVP 대상
- 게임: **League of Legends**
- 모드: **소환사의 협곡**
- 대상 범위: 패치노트에 포함된 **모든 항목** (챔피언 한정 아님)

---

## 2. 서비스 범위

### 2.1 포함 (MVP)
- 패치노트 자동 수집
- 패치 내용 자동 파싱
- 항목별 상향 / 하향 / 조정 분류
- 웹 기반 패치 버전 조회
- 항목별 상세 변경 내용 확인

### 2.2 제외 (후순위)
- 승률 / 티어 / 메타 분석
- 분기점 계산 및 성능 평가
- 로그인 / 개인화
- 커뮤니티 기능
- 다른 게임 모드 (ARAM 등)

---

## 3. 패치노트 수집 요구사항

### 3.1 패치노트 목록 수집
- 서버는 주기적으로 아래 URL을 폴링한다.
  - https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/
- 새로운 패치노트가 감지되면 상세 수집을 수행한다.

### 3.2 패치노트 상세 수집
- 대상 URL 예시  
  - https://www.leagueoflegends.com/ko-kr/news/game-updates/patch-XX-X-notes/

- 수집 항목
  - 패치 버전 (예: 26.2)
  - 패치 날짜
  - 섹션 구조 (챔피언 / 아이템 / 시스템 등)
  - 각 항목의 원문 텍스트

---

## 4. 데이터 파싱 및 분류 규칙

### 4.1 기본 분류 단위
- **패치 항목 (Patch Item)**
  - 예: 특정 챔피언, 아이템, 시스템 요소

---

### 4.2 변경 유형 분류

모든 패치 항목은 아래 **3가지 중 하나로만 분류**한다.

#### 1) 상향 (BUFF)
- 모든 변경이 명확하게 긍정적인 경우
- 예:
  - 피해량 증가
  - 쿨타임 감소
  - 계수 증가
  - 비용 감소

#### 2) 하향 (NERF)
- 모든 변경이 명확하게 부정적인 경우
- 예:
  - 피해량 감소
  - 쿨타임 증가
  - 계수 감소
  - 비용 증가

#### 3) 조정 (ADJUST)
다음 중 하나라도 해당하면 **무조건 ‘조정’** 으로 분류한다.

- 수치 증가 + 계수 감소 (또는 반대)
- 초반/후반 등 구간별 성능 변화
- 특정 조건에 따라 성능이 달라지는 경우
- 단순 상·하향 판단이 어려운 경우

> **원칙:** 애매하면 판단하지 않는다.

---

### 4.3 조정 항목 표기 방식
- 조정 항목은 좋고 나쁨을 판단하지 않는다.
- 변경 전/후 수치만 명확히 표기한다.

예시:
```
[조정]
Q 기본 피해량: 80 → 90
AP 계수: 0.6 → 0.5
```

---

## 5. 데이터 저장 구조 (개념)

### 5.1 주요 엔티티
- Game
- Patch
- PatchItem
- PatchChange

### 5.2 PatchChange 필드 예시
- id
- patchId
- category (챔피언 / 아이템 / 시스템)
- name
- changeType (BUFF | NERF | ADJUST)
- beforeValue (텍스트 허용)
- afterValue (텍스트 허용)
- rawDescription (원문 보존)

> MVP 단계에서는 **원문 보존 우선**

---

## 6. 웹 서비스 기능 요구사항

### 6.1 메인 페이지
- 패치 버전 리스트 노출 (최신 우선)
- 각 패치에 대해 다음 정보 제공
  - 패치 버전
  - 패치 날짜
  - 상향 / 하향 / 조정 항목 개수 요약

---

### 6.2 패치 상세 페이지

#### 기본 구성
- 패치 버전 헤더
- 필터 탭
  - 전체
  - 상향
  - 하향
  - 조정

#### 항목 리스트
- 항목명
- 변경 유형 배지
- 카테고리 표시

#### 상세 보기
- 클릭 시 다음 정보 표시
  - 변경 전 / 후 수치 비교
  - 원문 텍스트
  - 변경 포인트 강조

> UX 원칙: **빠른 스캔 + 쉬운 비교**

---

## 7. 기술 및 시스템 요구사항

### 7.1 Frontend (User Interface)
- **Framework**: Next.js 16+ (App Router 및 최신 버전 사용 권장)
- **Core**: React, TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI 기반)
- **상태 관리**: Server State(React Query) 또는 Context API

### 7.2 Backend & Data Logic
- **Execution Environment**: Next.js Route Handlers (Serverless)
- **HTML Parsing**: `cheerio` 또는 `jsdom` (서버 사이드 파싱)
- **Data Storage**: 
  - MVP: Supabase (PostgreSQL)
- **Scheduled Tasks (Cron)**:
  - Vercel Cron 또는 GitHub Actions (주기적 패치 노트 수집)

### 7.3 Development & Infra
- **Version Control**: Git / GitHub
- **Deployment**: Vercel (Frontend + Serverless Functions)
- **Package Manager**: pnpm

---

## 8. 확장 고려 사항
- 다른 게임 추가
- 다른 게임 모드 지원
- 분기점 계산 로직 추가
- 패치 간 변화 비교
- 외부 API 제공

---

## 9. 서비스 철학

> **PatchDiff는 강함을 말하지 않는다.**  
> **변화만 보여준다.**
