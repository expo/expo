export declare function loadBasicModelAsync({ uri, onProgress, onAssetRequested, loader, LoaderClass, }: {
    uri: string;
    onProgress: () => void;
    onAssetRequested: () => void;
    loader?: any;
    LoaderClass: any;
}): Promise<{}>;
export declare const loadAsync: (res: any, onProgress?: any, onAssetRequested?: any) => Promise<any>;
export default loadAsync;
