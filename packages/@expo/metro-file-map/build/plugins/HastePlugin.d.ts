/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Console, FileMapPlugin, FileMapPluginInitOptions, FileMapPluginWorker, HasteConflict, HasteMap, HasteMapItemMetadata, HTypeValue, Path, PerfLogger, ReadonlyFileSystemChanges } from '../types';
export interface HasteMapOptions {
    readonly console?: Console | null;
    readonly enableHastePackages: boolean;
    readonly hasteImplModulePath: string | null;
    readonly perfLogger?: PerfLogger | null;
    readonly platforms: ReadonlySet<string>;
    readonly rootDir: Path;
    readonly failValidationOnConflicts: boolean;
}
export default class HastePlugin implements HasteMap, FileMapPlugin<null, string | null> {
    #private;
    readonly name: 'haste';
    constructor(options: HasteMapOptions);
    initialize({ files }: FileMapPluginInitOptions<null, string | null>): Promise<void>;
    getSerializableSnapshot(): null;
    getModule(name: string, platform?: string | undefined | null, supportsNativePlatform?: boolean | undefined | null, type?: HTypeValue | undefined | null): Path | undefined | null;
    getModuleNameByPath(mixedPath: Path): string | undefined | null;
    getPackage(name: string, platform: string | undefined | null, _supportsNativePlatform?: boolean | undefined | null): Path | undefined | null;
    onChanged(delta: ReadonlyFileSystemChanges<string | null | undefined>): void;
    setModule(id: string, module: HasteMapItemMetadata): void;
    assertValid(): void;
    computeConflicts(): HasteConflict[];
    getCacheKey(): string;
    getWorker(): FileMapPluginWorker;
}
