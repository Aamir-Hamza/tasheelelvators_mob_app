export function padSeq(n: number, width = 3): string {
  return String(n).padStart(width, '0');
}

export function nextPrefixedId(prefix: string, existing: string[], width = 3): string {
  const nums = existing
    .map((id) => {
      const match = id.match(/(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${padSeq(next, width)}`;
}
