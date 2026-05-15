/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export interface HType {
    readonly MTIME: 0;
    readonly SIZE: 1;
    readonly VISITED: 2;
    readonly SHA1: 3;
    readonly SYMLINK: 4;
    readonly PLUGINDATA: 5;
    readonly PATH: 0;
    readonly TYPE: 1;
    readonly MODULE: 0;
    readonly PACKAGE: 1;
    readonly GENERIC_PLATFORM: 'g';
    readonly NATIVE_PLATFORM: 'native';
}
export type HTypeValue = 0 | 1 | 2 | 3 | 4 | 5 | 'g' | 'native';
declare const H: HType;
export default H;
