-- release_date: TIMESTAMPTZ -> DATE (원래 스키마로 복구)
-- timestamptz의 UTC 날짜 부분만 추출
ALTER TABLE patches
  ALTER COLUMN release_date TYPE DATE
  USING (release_date AT TIME ZONE 'UTC')::date;
