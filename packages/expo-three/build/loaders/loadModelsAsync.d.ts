import * as THREE from 'three';
export declare function loadTextureAsync({ asset }: {
    asset: any;
}): Promise<THREE.Texture | undefined>;
export declare function loadMtlAsync({ asset, onAssetRequested }: {
    asset: any;
    onAssetRequested: any;
}): Promise<any>;
export declare function loadObjAsync({ asset, onAssetRequested, onMtlAssetRequested, mtlAsset, materials, }: {
    asset: any;
    onAssetRequested: any;
    onMtlAssetRequested: any;
    mtlAsset: any;
    materials: any;
}): Promise<any>;
export declare function loadDaeAsync({ asset, onAssetRequested, onProgress }: {
    asset: any;
    onAssetRequested: any;
    onProgress: any;
}): Promise<{} | undefined>;
export declare function loadArrayBufferAsync({ uri, onProgress }: {
    uri: any;
    onProgress: any;
}): Promise<{}>;
