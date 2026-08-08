/**
 * Narrows a nullable value, throwing when it really is `null` or `undefined`.
 *
 * Prefer it over a `!` assertion in specs: `!` erases at runtime, so a broken
 * expectation surfaces as a `TypeError` on some later line, while this throws
 * where the value went missing and names it.
 */
export function requireNotNull<T>(value: T | null | undefined, name: string): T {
  if (value == null) {
    throw new Error(`${name} is unexpectedly null`);
  }
  return value;
}
