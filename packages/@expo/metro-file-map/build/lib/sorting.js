"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareStrings = compareStrings;
exports.chainComparators = chainComparators;
// Utilities for working with Array.prototype.sort
function compareStrings(a, b) {
    if (a == null) {
        return b == null ? 0 : -1;
    }
    if (b == null) {
        return 1;
    }
    return a.localeCompare(b);
}
function chainComparators(...comparators) {
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
