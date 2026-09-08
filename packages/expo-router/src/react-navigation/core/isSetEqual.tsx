export function isSetEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  // Callers pass unique values; this does not detect duplicates.
  return a.length === b.length && a.every((value) => b.includes(value));
}
