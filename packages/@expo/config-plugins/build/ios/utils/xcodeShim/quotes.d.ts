/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/** Wrap a value in double-quotes if it isn't already and contains characters
 *  that would force the new library's serializer to quote it. The old library
 *  caller convention is to hand us already-quoted strings — preserve that. */
export declare function quoteForRead(value: unknown): unknown;
/** Strip surrounding double-quotes when writing back to the new library's
 *  unquoted-by-convention storage. */
export declare function unquoteForWrite(value: unknown): unknown;
