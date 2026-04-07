/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Console, FileMapPlugin, FileMapPluginInitOptions, FileMapPluginWorker, MockMap as IMockMap, Path, RawMockMap, ReadonlyFileSystemChanges } from '../types';
export declare const CACHE_VERSION = 2;
export interface MockMapOptions {
    readonly console: Console;
    readonly mocksPattern: RegExp;
    readonly rawMockMap?: RawMockMap;
    readonly rootDir: Path;
    readonly throwOnModuleCollision: boolean;
}
export default class MockPlugin implements FileMapPlugin<RawMockMap, undefined>, IMockMap {
    #private;
    readonly name: 'mocks';
    constructor({ console, mocksPattern, rawMockMap, rootDir, throwOnModuleCollision, }: MockMapOptions);
    initialize({ files, pluginState }: FileMapPluginInitOptions<RawMockMap>): Promise<void>;
    getMockModule(name: string): Path | undefined | null;
    onChanged(delta: ReadonlyFileSystemChanges<undefined | null>): void;
    getSerializableSnapshot(): RawMockMap;
    assertValid(): void;
    getCacheKey(): string;
    getWorker(): FileMapPluginWorker | undefined | null;
}
