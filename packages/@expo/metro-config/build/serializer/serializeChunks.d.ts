import { AssetData, MetroConfig, MixedOutput, Module, ReadOnlyGraph } from 'metro';
import { ConfigT, SerializerConfigT } from 'metro-config';
import { ExpoSerializerOptions } from './fork/baseJSBundle';
import { SerialAsset } from './serializerAssets';
import { SerializerConfigOptions } from './withExpoSerializers';
type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export type SerializeChunkOptions = {
    includeSourceMaps: boolean;
    includeBytecode: boolean;
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
    deps: Set<Module>;
    preModules: Set<Module>;
    requiredChunks: Set<Chunk>;
    constructor(name: string, entries: Module<MixedOutput>[], graph: ReadOnlyGraph<MixedOutput>, options: ExpoSerializerOptions, isAsync?: boolean, isVendor?: boolean);
    private getPlatform;
    private getFilename;
    private getStableChunkSource;
    private getFilenameForConfig;
    private serializeToCodeWithTemplates;
    hasAbsolutePath(absolutePath: string): boolean;
    private getComputedPathsForAsyncDependencies;
    private getAdjustedSourceMapUrl;
    private serializeToCode;
    serializeToAssetsAsync(serializerConfig: Partial<SerializerConfigT>, chunks: Chunk[], { includeSourceMaps, includeBytecode, unstable_beforeAssetSerializationPlugins, }: SerializeChunkOptions): Promise<SerialAsset[]>;
    private supportsBytecode;
    isHermesEnabled(): boolean;
}
export declare function getSortedModules(modules: Module<MixedOutput>[], { createModuleId, }: {
    createModuleId: (path: string) => number;
}): readonly Module<any>[];
export {};
