import { PermissionResponse } from 'expo-modules-core';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
export declare class Asset extends ExpoMediaLibraryNext.Asset {
    static create(filePath: string, album?: Album): Promise<Asset>;
    static deleteMany(assets: Asset[]): Promise<void>;
}
export declare class Album extends ExpoMediaLibraryNext.Album {
    static create(name: string, assetsRefs: string[] | Asset[], moveAssets?: boolean): Promise<Album>;
    static deleteMany(albums: Album[], deleteAssets?: boolean): Promise<void>;
    static getAll(): Promise<Album[]>;
}
export type GranularPermission = 'audio' | 'photo' | 'video';
export declare function requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
//# sourceMappingURL=index.d.ts.map