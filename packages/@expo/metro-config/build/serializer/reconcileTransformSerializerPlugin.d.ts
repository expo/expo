import { MixedOutput, Module, ReadOnlyGraph, SerializerOptions } from 'metro';
import { InputConfigT, SerializerConfigT } from 'metro-config';
type Serializer = NonNullable<SerializerConfigT['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export declare function createPostTreeShakeTransformSerializerPlugin(config: InputConfigT): (entryPoint: string, preModules: readonly Module<MixedOutput>[], graph: ReadOnlyGraph, options: SerializerOptions) => Promise<SerializerParameters>;
export {};
