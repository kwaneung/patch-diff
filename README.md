This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 크롤링 실행 (로컬)

패치노트 데이터를 수집하려면 `.env.local`에 `CRON_SECRET`이 설정되어 있어야 합니다.

### 1. Append 크롤링 (기본 / 크론용)

서버에서 주기적으로 돌리는 크론 잡과 동일. game-updates 페이지의 **초기 HTML만** fetch하여 신규 패치만 추가합니다.

```bash
# dev 서버 실행 후
curl -X GET "http://localhost:3000/api/crawl" \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d '=' -f2)"
```

### 2. Init 크롤링 (DB 초기화 후)

DB truncate 후 **처음부터 전체 패치**를 수집할 때 사용. Playwright로 "더 보기" 버튼을 3회 클릭한 뒤 HTML을 수집합니다.

**사전 준비**: Chromium 설치

```bash
npx playwright install chromium
```

**실행**

```bash
# dev 서버 실행 후
curl -X GET "http://localhost:3000/api/crawl/init" \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d '=' -f2)"
```

> Init 크롤링은 Playwright(Chromium)를 사용하므로 **로컬 전용**입니다. Vercel 서버리스에서는 동작하지 않습니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
