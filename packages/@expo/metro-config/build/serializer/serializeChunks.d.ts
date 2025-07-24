/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { MetroConfig, AssetData } from '@expo/metro/metro';
import type { MixedOutput, Module, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler/types.flow';
import type { ConfigT, SerializerConfigT } from '@expo/metro/metro-config';
import { ExpoSerializerOptions } from './fork/baseJSBundle';
import { SerialAsset } from './serializerAssets';
import { SerializerConfigOptions } from './withExpoSerializers';
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
    entries: Module<MixedOutput>[];
    graph: ReadOnlyGraph<MixedOutput>;
    options: ExpoSerializerOptions;
    isAsync: boolean;
    isVendor: boolean;
    isEntry: boolean;
    deps: Set<Module>;
    preModules: Set<Module>;
    requiredChunks: Set<Chunk>;
    constructor(name: string, entries: Module<MixedOutput>[], graph: ReadOnlyGraph<MixedOutput>, options: ExpoSerializerOptions, isAsync?: boolean, isVendor?: boolean, isEntry?: boolean);
    private getPlatform;
    private getFilename;
    private getStableChunkSource;
    private getFilenameForConfig;
    private serializeToCodeWithTemplates;
    hasAbsolutePath(absolutePath: string): boolean;
    private getComputedPathsForAsyncDependencies;
    private getAdjustedSourceMapUrl;
    private serializeToCode;
    private boolishTransformOption;
    serializeToAssetsAsync(serializerConfig: Partial<SerializerConfigT>, chunks: Chunk[], { includeSourceMaps, unstable_beforeAssetSerializationPlugins }: SerializeChunkOptions): Promise<SerialAsset[]>;
    private supportsBytecode;
    isHermesEnabled(): boolean;
}
export declare function getSortedModules(modules: Module<MixedOutput>[], { createModuleId, }: {
    createModuleId: (path: string) => number;
}): readonly Module<any>[];
export {};
