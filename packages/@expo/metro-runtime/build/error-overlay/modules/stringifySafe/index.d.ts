/**
 * Copyright (c) Evan Bacon.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Tries to stringify with JSON.stringify and toString, but catches exceptions
 * (e.g. from circular objects) and always returns a string and never throws.
 */
export declare function createStringifySafeWithLimits(limits: {
    maxDepth?: number;
    maxStringLimit?: number;
    maxArrayLimit?: number;
    maxObjectKeysLimit?: number;
}): (foo: any) => string;
declare const stringifySafe: (foo: any) => string;
export default stringifySafe;
//# sourceMappingURL=index.d.ts.map