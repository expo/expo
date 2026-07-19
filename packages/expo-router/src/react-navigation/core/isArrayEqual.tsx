/**
 * Compare two arrays with primitive values as the content.
 * We need to make sure that both values and order match.
 */
export function isArrayEqual(a: any[], b: any[]) {
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  return a.every((it, index) => Object.is(it, b[index]));
}
