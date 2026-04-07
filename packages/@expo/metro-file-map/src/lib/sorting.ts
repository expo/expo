/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Utilities for working with Array.prototype.sort

export function compareStrings(a: null | string, b: null | string): number {
  if (a == null) {
    return b == null ? 0 : -1;
  }
  if (b == null) {
    return 1;
  }
  return a.localeCompare(b);
}

export function chainComparators<T>(
  ...comparators: ((a: T, b: T) => number)[]
): (a: T, b: T) => number {
  return (a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}
