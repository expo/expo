/**
 * Compare two arrays to check if the first array starts with the second array.
 */
export function arrayStartsWith<T>(array: T[], start: T[]) {
  if (start.length > array.length) {
    return false;
  }

  return start.every((it, index) => it === array[index]);
}
