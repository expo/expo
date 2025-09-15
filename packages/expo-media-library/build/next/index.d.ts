import { PermissionResponse } from 'expo-modules-core';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import { GranularPermission } from './types/GranularPermission';
export * from './MediaLibraryNext.types';
export declare class Query extends ExpoMediaLibraryNext.Query {
}
export declare class Asset extends ExpoMediaLibraryNext.Asset {
    static create(filePath: string, album?: Album): Promise<Asset>;
    static delete(assets: Asset[]): Promise<void>;
}
export declare class Album extends ExpoMediaLibraryNext.Album {
    static create(name: string, assetsRefs: string[] | Asset[], moveAssets?: boolean): Promise<Album>;
    static delete(albums: Album[], deleteAssets?: boolean): Promise<void>;
    static getAll(): Promise<Album[]>;
}
export declare function requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
//# sourceMappingURL=index.d.ts.map