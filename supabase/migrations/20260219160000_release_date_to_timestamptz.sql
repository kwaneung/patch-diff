-- release_date: DATE -> TIMESTAMPTZ (UTC 저장, 표시 시 KST 변환)
-- 기존 DATE 값은 UTC midnight로 변환
ALTER TABLE patches
  ALTER COLUMN release_date TYPE TIMESTAMPTZ
  USING (release_date::timestamp AT TIME ZONE 'UTC');
