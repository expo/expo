/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig, AssetData } from '@expo/metro/metro';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types';
import type { ConfigT, SerializerConfigT } from '@expo/metro/metro-config';
import type { ExpoSerializerOptions } from './fork/baseJSBundle';
import type { SerialAsset } from './serializerAssets';
import type { SerializerConfigOptions } from './withExpoSerializers';
type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export type SerializeChunkOptions = {
    includeSourceMaps: boolean;
    splitChunks: boolean;
} & SerializerConfigOptions;
export declare function graphToSerialAssetsAsync(config: MetroConfig, serializeChunkOptions: SerializeChunkOptions, ...props: SerializerParameters): Promise<{
    artifacts: SerialAsset[] | null;
    assets: AssetData[];
}>;
export declare class Chunk {
    name: string;
    entries: Set<Module<MixedOutput>>;
    graph: ReadOnlyGraph<MixedOutput>;
    options: ExpoSerializerOptions;
    isAsync: boolean;
    isVendor: boolean;
    isEntry: boolean;
    deps: Set<Module>;
    preModules: Set<Module>;
    requiredChunks: Set<Chunk>;
    /** Whether this chunk owns an isolated module registry and must retain all of its dependencies.
     * @remarks
     * When a chunk is sealed, its `deps` and `preModules` shouldn't be altered, and it doesn't qualify
     * for bundle/chunk splitting. This is the case for web workers, which must form a "closed" and
     * self-sufficient entry bundle.
     */
    sealed: boolean;
    constructor(name: string, entries: Set<Module<MixedOutput>>, graph: ReadOnlyGraph<MixedOutput>, options: ExpoSerializerOptions, isAsync?: boolean, isVendor?: boolean, isEntry?: boolean);
    seal(): void;
    private getPlatform;
    getFilename(src: string): string;
    getStableChunkSource(serializerConfig: Partial<SerializerConfigT>): string;
    private serializeToCodeWithTemplates;
    hasAbsolutePath(absolutePath: string): boolean;
    private _asyncTargets?;
    getAsyncChunkTargets(chunkByPath: Map<string, Chunk>): Set<Chunk>;
    private getComputedPathsForAsyncDependencies;
    private getAdjustedSourceMapUrl;
    private serializeToCode;
    private boolishTransformOption;
    serializeToAssetsAsync(serializerConfig: Partial<SerializerConfigT>, chunksByPath: Map<string, Chunk>, filenamesByChunk: Map<Chunk, string>, { includeSourceMaps, unstable_beforeAssetSerializationPlugins }: SerializeChunkOptions): Promise<SerialAsset[]>;
    private supportsBytecode;
    isHermesEnabled(): boolean;
}
export declare function getSortedModules(modules: Module<MixedOutput>[], { createModuleId, }: {
    createModuleId: (path: string) => number;
}): readonly Module<any>[];
export {};
