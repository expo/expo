import * as AssetSources from './AssetSources';
declare type AssetDescriptor = {
    name: string;
    type: string;
    hash?: string | null;
    uri: string;
    width?: number | null;
    height?: number | null;
};
declare type DownloadPromiseCallbacks = {
    resolve: () => void;
    reject: (error: Error) => void;
};
export declare type AssetMetadata = AssetSources.AssetMetadata;
export declare class Asset {
    static byHash: {};
    static byUri: {};
    name: string;
    type: string;
    hash: string | null;
    uri: string;
    localUri: string | null;
    width: number | null;
    height: number | null;
    downloading: boolean;
    downloaded: boolean;
    _downloadCallbacks: DownloadPromiseCallbacks[];
    constructor({ name, type, hash, uri, width, height }: AssetDescriptor);
    static loadAsync(moduleId: number | number[] | string | string[]): Promise<Asset[]>;
    static fromModule(virtualAssetModule: number | string): Asset;
    static fromMetadata(meta: AssetMetadata): Asset;
    static fromURI(uri: string): Asset;
    downloadAsync(): Promise<this>;
}
export {};
