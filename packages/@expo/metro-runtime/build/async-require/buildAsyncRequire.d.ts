/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Must satisfy the requirements of the Metro bundler.
 * https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0605-lazy-bundling.md#__loadbundleasync-in-metro
 */
type AsyncRequire = (path: string) => Promise<void>;
/** Create an `loadBundleAsync` function in the expected shape for Metro bundler. */
export declare function buildAsyncRequire(): AsyncRequire;
export {};
//# sourceMappingURL=buildAsyncRequire.d.ts.map