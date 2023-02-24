import { AssetMetadata } from './AssetSources';
export type AssetDescriptor = {
    name: string;
    type: string;
    hash?: string | null;
    uri: string;
    width?: number | null;
    height?: number | null;
};
type DownloadPromiseCallbacks = {
    resolve: () => void;
    reject: (error: Error) => void;
};
export { AssetMetadata };
/**
 * The `Asset` class represents an asset in your app. It gives metadata about the asset (such as its
 * name and type) and provides facilities to load the asset data.
 */
export declare class Asset {
    /**
     * @private
     */
    static byHash: {};
    /**
     * @private
     */
    static byUri: {};
    /**
     * The name of the asset file without the extension. Also without the part from `@` onward in the
     * filename (used to specify scale factor for images).
     */
    name: string;
    /**
     * The extension of the asset filename.
     */
    type: string;
    /**
     * The MD5 hash of the asset's data.
     */
    hash: string | null;
    /**
     * A URI that points to the asset's data on the remote server. When running the published version
     * of your app, this refers to the location on Expo's asset server where Expo has stored your
     * asset. When running the app from Expo CLI during development, this URI points to Expo CLI's
     * server running on your computer and the asset is served directly from your computer.
     */
    uri: string;
    /**
     * If the asset has been downloaded (by calling [`downloadAsync()`](#downloadasync)), the
     * `file://` URI pointing to the local file on the device that contains the asset data.
     */
    localUri: string | null;
    /**
     * If the asset is an image, the width of the image data divided by the scale factor. The scale
     * factor is the number after `@` in the filename, or `1` if not present.
     */
    width: number | null;
    /**
     * If the asset is an image, the height of the image data divided by the scale factor. The scale factor is the number after `@` in the filename, or `1` if not present.
     */
    height: number | null;
    downloading: boolean;
    downloaded: boolean;
    /**
     * @private
     */
    _downloadCallbacks: DownloadPromiseCallbacks[];
    constructor({ name, type, hash, uri, width, height }: AssetDescriptor);
    /**
     * A helper that wraps `Asset.fromModule(module).downloadAsync` for convenience.
     * @param moduleId An array of `require('path/to/file')` or external network URLs. Can also be
     * just one module or URL without an Array.
     * @return Returns a Promise that fulfills with an array of `Asset`s when the asset(s) has been
     * saved to disk.
     * @example
     * ```ts
     * const [{ localUri }] = await Asset.loadAsync(require('./assets/snack-icon.png'));
     * ```
     */
    static loadAsync(moduleId: number | number[] | string | string[]): Promise<Asset[]>;
    /**
     * Returns the [`Asset`](#asset) instance representing an asset given its module or URL.
     * @param virtualAssetModule The value of `require('path/to/file')` for the asset or external
     * network URL
     * @return The [`Asset`](#asset) instance for the asset.
     */
    static fromModule(virtualAssetModule: number | string): Asset;
    static fromMetadata(meta: AssetMetadata): Asset;
    static fromURI(uri: string): Asset;
    /**
     * Downloads the asset data to a local file in the device's cache directory. Once the returned
     * promise is fulfilled without error, the [`localUri`](#assetlocaluri) field of this asset points
     * to a local file containing the asset data. The asset is only downloaded if an up-to-date local
     * file for the asset isn't already present due to an earlier download. The downloaded `Asset`
     * will be returned when the promise is resolved.
     * @return Returns a Promise which fulfills with an `Asset` instance.
     */
    downloadAsync(): Promise<this>;
}
//# sourceMappingURL=Asset.d.ts.map