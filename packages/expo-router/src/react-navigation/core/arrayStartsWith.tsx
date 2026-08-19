/**
 * Compare two arrays to check if the first array starts with the second array.
 */
// TODO(@ubax): dead code, remove in a follow-up. Orphan module with zero importers.
export function arrayStartsWith<T>(array: T[], start: T[]) {
  if (start.length > array.length) {
    return false;
  }

  return start.every((it, index) => it === array[index]);
}
