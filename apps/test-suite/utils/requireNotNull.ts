/**
 * Narrows a nullable value, throwing when it really is `null` or `undefined`.
 *
 * Prefer it over a `!` assertion in specs: `!` erases at runtime, so a broken
 * expectation surfaces as a `TypeError` on some later line, while this throws
 * where the value went missing.
 */
export function requireNotNull<T>(value: T | null | undefined): T {
  if (value == null) {
    const error = new Error(`${value} is unexpectedly null`);
    console.error(error.message, error.stack);
    throw error;
  }
  return value;
}
