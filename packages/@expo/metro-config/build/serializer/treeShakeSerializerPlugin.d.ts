import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import type { DynamicRequiresBehavior } from 'metro/src/ModuleGraph/worker/collectDependencies';
import { InputConfigT, SerializerConfigT } from 'metro-config';
export type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
export type SerializerParameters = Parameters<Serializer>;
export declare function treeShakeSerializerPlugin(config: InputConfigT): (entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions) => Promise<SerializerParameters>;
export declare function isShakingEnabled(graph: ReadOnlyGraph, options: SerializerOptions): boolean;
export type AllowOptionalDependenciesWithOptions = {
    exclude: string[];
};
export type AllowOptionalDependencies = boolean | AllowOptionalDependenciesWithOptions;
export type CollectDependenciesOptions = {
    asyncRequireModulePath: string;
    dependencyMapName: string | null;
    dynamicRequires: DynamicRequiresBehavior;
    inlineableCalls: readonly string[];
    keepRequireNames: boolean;
    allowOptionalDependencies: AllowOptionalDependencies;
    dependencyTransformer: any | undefined;
    /** Enable `require.context` statements which can be used to import multiple files in a directory. */
    unstable_allowRequireContext: boolean;
};
export declare function createPostTreeShakeTransformSerializerPlugin(config: InputConfigT): (entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions) => Promise<SerializerParameters>;
