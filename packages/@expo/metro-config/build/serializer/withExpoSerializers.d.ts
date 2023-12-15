import { MetroConfig, Module, ReadOnlyGraph } from 'metro';
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
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;
export declare function withExpoSerializers(config: InputConfigT): InputConfigT;
export declare function withSerializerPlugins(config: InputConfigT, processors: SerializerPlugin[]): InputConfigT;
export declare function createDefaultExportCustomSerializer(config: Partial<MetroConfig>): Serializer;
export declare function createSerializerFromSerialProcessors(config: MetroConfig, processors: (SerializerPlugin | undefined)[], originalSerializer?: Serializer | null): Serializer;
export { SerialAsset };
