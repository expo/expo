import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { type Dependency } from '../transform-worker/collect-dependencies';
import { SerializerConfigT } from 'metro-config';
type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export declare function reconcileTransformSerializerPlugin(entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions): Promise<SerializerParameters>;
export declare function sortDependencies(dependencies: readonly Dependency[], accordingTo: Module['dependencies']): Map<string, Dependency>;
export {};
