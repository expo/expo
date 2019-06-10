import { Platform } from '@unimodules/core';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import computeMd5 from 'blueimp-md5';
import { getAssetByID } from './AssetRegistry';
import resolveAssetSource, { setCustomSourceTransformer } from './resolveAssetSource';

import * as AssetSources from './AssetSources';
import * as AssetUris from './AssetUris';
import * as EmbeddedAssets from './EmbeddedAssets';
import * as ImageAssets from './ImageAssets';

type AssetDescriptor = {
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

export type AssetMetadata = AssetSources.AssetMetadata;

const IS_MANAGED_ENV = !!Constants.appOwnership;

export class Asset {
  static byHash = {};
  static byUri = {};

  name: string;
  type: string;
  hash: string | null = null;
  uri: string;
  localUri: string | null = null;
  width: number | null = null;
  height: number | null = null;
  downloading: boolean = false;
  downloaded: boolean = false;
  _downloadCallbacks: DownloadPromiseCallbacks[] = [];

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

    // This only applies to assets that are bundled in Expo standalone apps
    if (IS_MANAGED_ENV && hash) {
      this.localUri = EmbeddedAssets.getEmbeddedAssetUri(hash, type);
      if (this.localUri) {
        this.downloaded = true;
      }
    }
  }

  static loadAsync(moduleId: number | number[]): Promise<void[]> {
    const moduleIds = Array.isArray(moduleId) ? moduleId : [moduleId];
    return Promise.all(moduleIds.map(moduleId => Asset.fromModule(moduleId).downloadAsync()));
  }

  static fromModule(virtualAssetModule: number | string): Asset {
    if (typeof virtualAssetModule === 'string') {
      return Asset.fromURI(virtualAssetModule);
    }

    const meta = getAssetByID(virtualAssetModule);
    if (!meta) {
      throw new Error(`Module "${virtualAssetModule}" is missing from the asset registry`);
    }

    // Outside of the managed env we need the moduleId to initialize the asset
    // because resolveAssetSource depends on it
    if (!IS_MANAGED_ENV) {
      const { uri } = resolveAssetSource(virtualAssetModule);
      const asset = new Asset({
        name: meta.name,
        type: meta.type,
        hash: meta.hash,
        uri,
        width: meta.width,
        height: meta.height,
      });

      // TODO: FileSystem should probably support 'downloading' from drawable
      // resources But for now it doesn't (it only supports raw resources) and
      // React Native's Image works fine with drawable resource names for
      // images.
      if (Platform.OS === 'android' && !uri.includes(':') && (meta.width || meta.height)) {
        asset.localUri = asset.uri;
        asset.downloaded = true;
      }

      Asset.byHash[meta.hash] = asset;
      return asset;
    }

    return Asset.fromMetadata(meta);
  }

  static fromMetadata(meta: AssetMetadata): Asset {
    // The hash of the whole asset, not to be confused with the hash of a specific file returned
    // from `selectAssetSource`
    const metaHash = meta.hash;
    if (Asset.byHash[metaHash]) {
      return Asset.byHash[metaHash];
    } else if (!IS_MANAGED_ENV && !Asset.byHash[metaHash]) {
      throw new Error('Assets must be initialized with Asset.fromModule');
    }

    const { uri, hash } = AssetSources.selectAssetSource(meta);
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

  async _downloadAsyncWeb(): Promise<void> {
    if (ImageAssets.isImageType(this.type)) {
      const { width, height, name } = await ImageAssets.getImageInfoAsync(this.uri);
      this.width = width;
      this.height = height;
      this.name = name;
    } else {
      this.name = AssetUris.getFilename(this.uri);
    }
    this.localUri = this.uri;
  }

  async _downloadAsyncManagedEnv(): Promise<void> {
    const cacheFileId = this.hash || computeMd5(this.uri);
    const localUri = `${FileSystem.cacheDirectory}ExponentAsset-${cacheFileId}.${this.type}`;
    let { exists, md5 } = await FileSystem.getInfoAsync(localUri, {
      md5: true,
    });
    if (!exists || (this.hash !== null && md5 !== this.hash)) {
      ({ md5 } = await FileSystem.downloadAsync(this.uri, localUri, {
        md5: true,
      }));
      if (this.hash !== null && md5 !== this.hash) {
        throw new Error(
          `Downloaded file for asset '${this.name}.${this.type}' ` +
            `Located at ${this.uri} ` +
            `failed MD5 integrity check`
        );
      }
    }

    this.localUri = localUri;
  }

  async _downloadAsyncUnmanagedEnv(): Promise<void> {
    // Bail out if it's already at a file URL because it's already available locally
    if (this.uri.startsWith('file://')) {
      this.localUri = this.uri;
      return;
    }

    const cacheFileId = this.hash || computeMd5(this.uri);
    const localUri = `${FileSystem.cacheDirectory}ExponentAsset-${cacheFileId}.${this.type}`;
    // We don't check the FileSystem for an existing version of the asset and we
    // also don't perform an integrity check!
    await FileSystem.downloadAsync(this.uri, localUri);
    this.localUri = localUri;
  }

  async downloadAsync(): Promise<void> {
    if (this.downloaded) {
      return;
    }
    if (this.downloading) {
      await new Promise((resolve, reject) => {
        this._downloadCallbacks.push({ resolve, reject });
      });
      return;
    }
    this.downloading = true;

    try {
      if (Platform.OS === 'web') {
        await this._downloadAsyncWeb();
      } else if (IS_MANAGED_ENV) {
        await this._downloadAsyncManagedEnv();
      } else {
        await this._downloadAsyncUnmanagedEnv();
      }

      this.downloaded = true;
      this._downloadCallbacks.forEach(({ resolve }) => resolve());
    } catch (e) {
      this._downloadCallbacks.forEach(({ reject }) => reject(e));
      throw e;
    } finally {
      this.downloading = false;
      this._downloadCallbacks = [];
    }
  }
}

// Override React Native's asset resolution for `Image` components
setCustomSourceTransformer(resolver => {
  try {
    const asset = Asset.fromMetadata(resolver.asset);
    return resolver.fromSource(asset.downloaded ? asset.localUri! : asset.uri);
  } catch (e) {
    return resolver.defaultAsset();
  }
});
