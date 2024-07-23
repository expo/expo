import { MetroConfig, MixedOutput, Module, ReadOnlyGraph } from 'metro';
import { ConfigT, InputConfigT } from 'metro-config';
import { ExpoSerializerOptions } from './fork/baseJSBundle';
import { SerialAsset } from './serializerAssets';
export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
export type SerializerParameters = [
    string,
    readonly Module[],
    ReadOnlyGraph,
    ExpoSerializerOptions
];
export type SerializerConfigOptions = {
    unstable_beforeAssetSerializationPlugins?: ((serializationInput: {
        graph: ReadOnlyGraph<MixedOutput>;
        premodules: Module[];
        debugId?: string;
    }) => Module[])[];
};
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters | Promise<SerializerParameters>;
export declare function withExpoSerializers(config: InputConfigT, options?: SerializerConfigOptions): InputConfigT;
export declare function withSerializerPlugins(config: InputConfigT, processors: SerializerPlugin[], options?: SerializerConfigOptions): InputConfigT;
export declare function createDefaultExportCustomSerializer(config: Partial<MetroConfig>, configOptions?: SerializerConfigOptions): Serializer;
export declare function createSerializerFromSerialProcessors(config: MetroConfig, processors: (SerializerPlugin | undefined)[], originalSerializer: Serializer | null, options?: SerializerConfigOptions): Serializer;
export { SerialAsset };
