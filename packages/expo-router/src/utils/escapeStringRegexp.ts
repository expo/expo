// TODO: Replace with the native `RegExp.escape` once it is supported across our runtime matrix
// (Hermes and older browsers do not implement it yet).

/**
 * Escapes the characters that have a special meaning in a regular expression, so `value` matches
 * literally. `-` becomes `\x2d` because `\-` is not a valid escape outside a character class in
 * Unicode-mode patterns.
 */
export function escapeStringRegexp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}
