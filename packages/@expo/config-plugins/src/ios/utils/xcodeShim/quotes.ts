/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The legacy `xcode` package preserves quotes inside in-memory build setting
 * values (e.g. `'"HelloWorld"'`). `@bacons/xcode` stores them unquoted in
 * `.props.buildSettings` and applies the quote wrap only at serialization time
 * (`json/writer`'s `ensureQuotes`).
 *
 * The shim's job is to translate values across that boundary so plugins that
 * read+write quoted strings keep working unchanged.
 */

/** Match the legacy library's "needs quoting" heuristic: anything outside the
 *  safe alphabet gets wrapped. */
const SAFE_VALUE_RE = /^[\w_$/:.]+$/;

/** Wrap a value in double-quotes if it isn't already and contains characters
 *  that would force the new library's serializer to quote it. The old library
 *  caller convention is to hand us already-quoted strings — preserve that. */
export function quoteForRead(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value === '') return '""';
  if (value.startsWith('"') && value.endsWith('"')) return value;
  if (SAFE_VALUE_RE.test(value)) return value;
  return `"${value}"`;
}

/** Strip surrounding double-quotes when writing back to the new library's
 *  unquoted-by-convention storage. */
export function unquoteForWrite(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
