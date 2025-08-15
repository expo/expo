import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
export declare class Asset extends ExpoMediaLibraryNext.Asset {
    static create(filePath: string, album?: Album): Promise<Asset>;
    static deleteMany(assets: Array<Asset>): Promise<void>;
}
export declare class Album extends ExpoMediaLibraryNext.Album {
    static create(name: string, assetsRefs: string[] | Asset[], moveAssets?: boolean): Promise<Album>;
    static deleteMany(albums: Array<Album>, deleteAssets?: Boolean): Promise<void>;
    static getAll(): Promise<Array<Album>>;
}
//# sourceMappingURL=index.d.ts.map