import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { InputConfigT, SerializerConfigT } from 'metro-config';
export type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
export type SerializerParameters = Parameters<Serializer>;
export declare function treeShakeSerializerPlugin(config: InputConfigT): (entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions) => Promise<SerializerParameters>;
export declare function isShakingEnabled(graph: ReadOnlyGraph, options: SerializerOptions): boolean;
export declare function createPostTreeShakeTransformSerializerPlugin(config: InputConfigT): (entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions) => Promise<SerializerParameters>;
