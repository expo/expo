import { getAssetByID } from '@react-native/assets-registry/registry';
import { Platform } from 'expo-modules-core';

import { AssetMetadata, selectAssetSource } from './AssetSources';
import * as AssetUris from './AssetUris';
import { downloadAsync } from './ExpoAsset';
import * as ImageAssets from './ImageAssets';
import { getLocalAssetUri } from './LocalAssets';
import { IS_ENV_WITH_LOCAL_ASSETS } from './PlatformUtils';
import resolveAssetSource from './resolveAssetSource';

// @docsMissing
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
 * Android resource URL prefix.
 * @hidden
 */
export const ANDROID_EMBEDDED_URL_BASE_RESOURCE = 'file:///android_res/';

/**
 * The `Asset` class represents an asset in your app. It gives metadata about the asset (such as its
 * name and type) and provides facilities to load the asset data.
 */
export class Asset {
  private static byHash: Record<string, Asset | undefined> = {};
  private static byUri: Record<string, Asset | undefined> = {};

  /**
   * The name of the asset file without the extension. Also without the part from `@` onward in the
   * filename (used to specify scale factor for images).
   */
  public name: string;
  /**
   * The extension of the asset filename.
   */
  public readonly type: string;
  /**
   * The MD5 hash of the asset's data.
   */
  public readonly hash: string | null = null;
  /**
   * A URI that points to the asset's data on the remote server. When running the published version
   * of your app, this refers to the location on Expo's asset server where Expo has stored your
   * asset. When running the app from Expo CLI during development, this URI points to Expo CLI's
   * server running on your computer and the asset is served directly from your computer. If you
   * are not using Classic Updates (legacy), this field should be ignored as we ensure your assets
   * are on device before running your application logic.
   */
  public readonly uri: string;
  /**
   * If the asset has been downloaded (by calling [`downloadAsync()`](#downloadasync)), the
   * `file://` URI pointing to the local file on the device that contains the asset data.
   */
  public localUri: string | null = null;
  /**
   * If the asset is an image, the width of the image data divided by the scale factor. The scale
   * factor is the number after `@` in the filename, or `1` if not present.
   */
  public width: number | null = null;
  /**
   * If the asset is an image, the height of the image data divided by the scale factor. The scale factor is the number after `@` in the filename, or `1` if not present.
   */
  public height: number | null = null;

  private downloading: boolean = false;

  /**
   * Whether the asset has finished downloading from a call to [`downloadAsync()`](#downloadasync).
   */
  public downloaded: boolean = false;

  private _downloadCallbacks: DownloadPromiseCallbacks[] = [];

  constructor({ name, type, hash = null, uri, width, height }: AssetDescriptor) {
    this.name = name;
    this.type = type;
    this.hash = hash;
    this.uri = uri;

    if (typeof width === 'number') {
      this.width = width;
    }
    if (typeof height === 'number') {
      this.height = height;
    }

    if (hash) {
      this.localUri = getLocalAssetUri(hash, type);
      if (this.localUri?.startsWith(ANDROID_EMBEDDED_URL_BASE_RESOURCE)) {
        // Treat Android embedded resources as not downloaded state, because the uri is not direct accessible.
        this.uri = this.localUri;
        this.localUri = null;
      } else if (this.localUri) {
        this.downloaded = true;
      }
    }

    if (Platform.OS === 'web') {
      if (!name) {
        this.name = AssetUris.getFilename(uri);
      }
      if (!type) {
        this.type = AssetUris.getFileExtension(uri);
      }
    }
  }

  // @needsAudit
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
  static loadAsync(moduleId: number | number[] | string | string[]): Promise<Asset[]> {
    const moduleIds = Array.isArray(moduleId) ? moduleId : [moduleId];
    return Promise.all(moduleIds.map((moduleId) => Asset.fromModule(moduleId).downloadAsync()));
  }

  // @needsAudit
  /**
   * Returns the [`Asset`](#asset) instance representing an asset given its module or URL.
   * @param virtualAssetModule The value of `require('path/to/file')` for the asset or external
   * network URL
   * @return The [`Asset`](#asset) instance for the asset.
   */
  static fromModule(
    virtualAssetModule: number | string | { uri: string; width: number; height: number }
  ): Asset {
    if (typeof virtualAssetModule === 'string') {
      return Asset.fromURI(virtualAssetModule);
    }
    if (
      typeof virtualAssetModule === 'object' &&
      'uri' in virtualAssetModule &&
      typeof virtualAssetModule.uri === 'string'
    ) {
      const extension = AssetUris.getFileExtension(virtualAssetModule.uri);
      return new Asset({
        name: '',
        type: extension.startsWith('.') ? extension.substring(1) : extension,
        hash: null,
        uri: virtualAssetModule.uri,
        width: virtualAssetModule.width,
        height: virtualAssetModule.height,
      });
    }

    const meta = getAssetByID(virtualAssetModule);
    if (!meta) {
      throw new Error(`Module "${virtualAssetModule}" is missing from the asset registry`);
    }

    // Outside of the managed env we need the moduleId to initialize the asset
    // because resolveAssetSource depends on it
    if (!IS_ENV_WITH_LOCAL_ASSETS) {
      // null-check is performed above with `getAssetByID`.
      const { uri } = resolveAssetSource(virtualAssetModule)!;

      const asset = new Asset({
        name: meta.name,
        type: meta.type,
        hash: meta.hash,
        uri,
        width: meta.width,
        height: meta.height,
      });

      // For images backward compatibility,
      // keeps localUri the same as uri for React Native's Image that
      // works fine with drawable resource names.
      if (Platform.OS === 'android' && !uri.includes(':') && (meta.width || meta.height)) {
        asset.localUri = asset.uri;
        asset.downloaded = true;
      }

      Asset.byHash[meta.hash] = asset;
      return asset;
    }

    return Asset.fromMetadata(meta);
  }

  // @docsMissing
  static fromMetadata(meta: AssetMetadata): Asset {
    // The hash of the whole asset, not to be confused with the hash of a specific file returned
    // from `selectAssetSource`
    const metaHash = meta.hash;
    const assetByHash = Asset.byHash[metaHash];
    if (assetByHash) {
      return assetByHash;
    }

    const { uri, hash } = selectAssetSource(meta);
    const asset = new Asset({
      name: meta.name,
      type: meta.type,
      hash,
      uri,
      width: meta.width,
      height: meta.height,
    });
    Asset.byHash[metaHash] = asset;
    return asset;
  }

  // @docsMissing
  static fromURI(uri: string): Asset {
    if (Asset.byUri[uri]) {
      return Asset.byUri[uri];
    }

    // Possibly a Base64-encoded URI
    let type = '';
    if (uri.indexOf(';base64') > -1) {
      type = uri.split(';')[0].split('/')[1];
    } else {
      const extension = AssetUris.getFileExtension(uri);
      type = extension.startsWith('.') ? extension.substring(1) : extension;
    }

    const asset = new Asset({
      name: '',
      type,
      hash: null,
      uri,
    });

    Asset.byUri[uri] = asset;

    return asset;
  }

  // @needsAudit
  /**
   * Downloads the asset data to a local file in the device's cache directory. Once the returned
   * promise is fulfilled without error, the [`localUri`](#localuri) field of this asset points
   * to a local file containing the asset data. The asset is only downloaded if an up-to-date local
   * file for the asset isn't already present due to an earlier download. The downloaded `Asset`
   * will be returned when the promise is resolved.
   *
   * > **Note:** There is no guarantee that files downloaded via `downloadAsync` persist between app sessions.
   * `downloadAsync` stores files in the caches directory, so it's up to the OS to clear this folder at its
   * own discretion or when the user manually purges the caches directory. Downloaded assets are stored as
   * `ExponentAsset-{cacheFileId}.{extension}` within the cache directory.
   * > To manually clear cached assets, you can use [`expo-file-system`](./filesystem/) to
   * delete the cache directory: `Paths.cache.delete()` or use the legacy API `deleteAsync(cacheDirectory)`.
   *
   * @return Returns a Promise which fulfills with an `Asset` instance.
   */
  async downloadAsync(): Promise<this> {
    if (this.downloaded) {
      return this;
    }
    if (this.downloading) {
      await new Promise<void>((resolve, reject) => {
        this._downloadCallbacks.push({ resolve, reject });
      });
      return this;
    }
    this.downloading = true;

    try {
      if (Platform.OS === 'web') {
        if (ImageAssets.isImageType(this.type)) {
          const { width, height, name } = await ImageAssets.getImageInfoAsync(this.uri);
          this.width = width;
          this.height = height;
          this.name = name;
        } else {
          this.name = AssetUris.getFilename(this.uri);
        }
      }
      this.localUri = await downloadAsync(this.uri, this.hash, this.type);

      this.downloaded = true;
      this._downloadCallbacks.forEach(({ resolve }) => resolve());
    } catch (e: any) {
      this._downloadCallbacks.forEach(({ reject }) => reject(e));
      throw e;
    } finally {
      this.downloading = false;
      this._downloadCallbacks = [];
    }
    return this;
  }
}
