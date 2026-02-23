/** UTC timestamptz를 한국(KST) 날짜로 포맷. release_date 표시용. */
export function formatReleaseDateKst(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
  });
}
