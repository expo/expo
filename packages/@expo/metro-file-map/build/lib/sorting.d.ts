/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export declare function compareStrings(a: null | string, b: null | string): number;
export declare function chainComparators<T>(...comparators: ((a: T, b: T) => number)[]): (a: T, b: T) => number;
