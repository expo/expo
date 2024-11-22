import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { SerializerConfigT } from 'metro-config';
import { Dependency } from '../transform-worker/collect-dependencies';
type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export declare function sortDependencies(dependencies: readonly Dependency[], accordingTo: Module['dependencies']): Map<string, Dependency>;
export declare function isEnvBoolean(graph: ReadOnlyGraph, name: string): boolean;
export declare function reconcileTransformSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): Promise<SerializerParameters>;
export {};
