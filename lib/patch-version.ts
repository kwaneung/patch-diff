/** 패치 버전(예: 26.11)을 숫자 기준으로 비교. 내림차순 sort용. */
export function comparePatchVersions(a: string, b: string): number {
  const parse = (version: string) => {
    const [major, minor = '0'] = version.split('.');
    return { major: Number(major), minor: Number(minor) };
  };

  const av = parse(a);
  const bv = parse(b);

  if (av.major !== bv.major) return bv.major - av.major;
  return bv.minor - av.minor;
}

export function sortPatchesByVersionDesc<T extends { version: string }>(
  patches: T[],
): T[] {
  return [...patches].sort((a, b) => comparePatchVersions(a.version, b.version));
}

/** release_date 우선, 동일·누락 시 버전 숫자 순. */
export function sortPatchesByReleaseDateDesc<
  T extends { version: string; release_date: string | null },
>(patches: T[]): T[] {
  return [...patches].sort((a, b) => {
    if (a.release_date && b.release_date) {
      const byDate = b.release_date.localeCompare(a.release_date);
      if (byDate !== 0) return byDate;
    }
    if (a.release_date && !b.release_date) return -1;
    if (!a.release_date && b.release_date) return 1;
    return comparePatchVersions(a.version, b.version);
  });
}
