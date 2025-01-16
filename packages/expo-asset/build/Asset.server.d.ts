import type { PackagerAsset } from '@react-native/assets-registry/registry';
type AssetMetadata = Pick<PackagerAsset, 'httpServerLocation' | 'name' | 'hash' | 'type' | 'scales' | 'width' | 'height'> & {
    uri?: string;
    fileHashes?: string[];
    fileUris?: string[];
};
type AssetDescriptor = {
    name: string;
    type: string;
    hash?: string | null;
    uri: string;
    width?: number | null;
    height?: number | null;
};
export declare class Asset {
    private static byHash;
    private static byUri;
    name: string;
    readonly type: string;
    readonly hash: string | null;
    readonly uri: string;
    localUri: string | null;
    width: number | null;
    height: number | null;
    downloaded: boolean;
    constructor({ name, type, hash, uri, width, height }: AssetDescriptor);
    static loadAsync(moduleId: number | number[] | string | string[]): Promise<Asset[]>;
    static fromModule(virtualAssetModule: number | string | {
        uri: string;
        width: number;
        height: number;
    }): Asset;
    static fromMetadata(meta: AssetMetadata): Asset;
    static fromURI(uri: string): Asset;
    downloadAsync(): Promise<this>;
}
export {};
//# sourceMappingURL=Asset.server.d.ts.map