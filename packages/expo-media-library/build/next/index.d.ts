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
    /**
     * Retrieves an album with the given title.
     * If multiple albums share the same title only one will be returned.
     * @param title - The title of the album to retrieve.
     * @returns A promise resolving to the `Album` if found, or `null` if no album with the given title exists.
     * @example
     * ```ts
     * const album = await Album.get("Camera");
     * if (album) {
     *   console.log(`Found album with ID: ${album.id}`);
     * }
     * ```
     */
    static get(title: String): Promise<Album | null>;
}
export declare function requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
//# sourceMappingURL=index.d.ts.map