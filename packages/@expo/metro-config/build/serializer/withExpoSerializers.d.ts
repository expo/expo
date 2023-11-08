import { ConfigT, InputConfigT } from 'metro-config';
import { SerialAsset } from './serializerAssets';
export type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
export type SerializerParameters = Parameters<Serializer>;
export type SerializerPlugin = (...props: SerializerParameters) => SerializerParameters;
export declare function withExpoSerializers(config: InputConfigT): InputConfigT;
export declare function withSerializerPlugins(config: InputConfigT, processors: SerializerPlugin[]): InputConfigT;
export declare function getDefaultSerializer(serializerConfig: ConfigT['serializer'], fallbackSerializer?: Serializer | null): Serializer;
export declare function graphToSerialAssets(serializerConfig: ConfigT['serializer'], { includeMaps }: {
    includeMaps: boolean;
}, ...props: SerializerParameters): SerialAsset[] | null;
export declare function createSerializerFromSerialProcessors(config: ConfigT['serializer'], processors: (SerializerPlugin | undefined)[], originalSerializer?: Serializer | null): Serializer;
export { SerialAsset };
