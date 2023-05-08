import { ConfigT, InputConfigT } from 'metro-config';
import { SerialAsset } from './serializerAssets';
export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
export type SerializerParameters = Parameters<Serializer>;
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;
export declare function withExpoSerializers(config: InputConfigT): InputConfigT;
export declare function withSerializerPlugins(config: InputConfigT, processors: SerializerPlugin[]): InputConfigT;
export declare function createSerializerFromSerialProcessors(processors: (SerializerPlugin | undefined)[], originalSerializer?: Serializer): Serializer;
export { SerialAsset };
