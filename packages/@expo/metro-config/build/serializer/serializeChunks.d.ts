import { AssetData, MetroConfig } from 'metro';
import { ConfigT } from 'metro-config';
import { SerialAsset } from './serializerAssets';
type Serializer = NonNullable<ConfigT['serializer']['customSerializer']>;
type SerializerParameters = Parameters<Serializer>;
export declare function graphToSerialAssetsAsync(config: MetroConfig, { includeMaps }: {
    includeMaps: boolean;
}, ...props: SerializerParameters): Promise<{
    artifacts: SerialAsset[] | null;
    assets: AssetData[];
}>;
export {};
