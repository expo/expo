import { PixelRatio, Platform } from 'react-native';
import AssetRegistry from 'react-native/Libraries/Image/AssetRegistry';
import AssetSourceResolver from 'react-native/Libraries/Image/AssetSourceResolver';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

let FS, Constants;

try {
  FS = require('expo-file-system').FileSystem;
} catch (error) {
  throw new Error('`expo-asset` requires `expo-file-system` package to be installed and linked.');
}

try {
  Constants = require('expo-constants').Constants;
} catch (error) {
  throw new Error('`expo-asset` requires `expo-constants` package to be installed and linked.');
}

// Fast lookup check if assets are available in the local bundle.
const bundledAssets = new Set(FS.bundledAssets || []);

// Return { uri, hash } for an asset's file, picking the correct scale, based on its React Native
// metadata. If the asset isn't an image just picks the first file.
const pickScale = meta => {
  // This logic is based on that in AssetSourceResolver.js, we just do it with our own tweaks for
  // Expo

  const scale =
    meta.scales.length > 1 ? AssetSourceResolver.pickScale(meta.scales, PixelRatio.get()) : 1;
  const index = meta.scales.findIndex(s => s === scale);
  const hash = meta.fileHashes ? meta.fileHashes[index] || meta.fileHashes[0] : meta.hash;

  const suffix =
    '/' +
    meta.name +
    (scale === 1 ? '' : '@' + scale + 'x') +
    '.' +
    meta.type +
    '?platform=' +
    Platform.OS +
    '&hash=' +
    meta.hash;

  // Allow asset processors to directly provide the URL that will be loaded
  if (meta.uri) {
    return {
      uri: meta.uri,
      hash,
    };
  }

  if (/^https?:/.test(meta.httpServerLocation)) {
    // This is a full URL, so we avoid prepending bundle URL/cloudfront
    // This usually means Asset is on a different server, and the URL is present in the bundle
    return {
      uri: meta.httpServerLocation + suffix,
      hash,
    };
  }

  if (Constants.manifest && Constants.manifest.developer) {
    // Development server URI is pieced together
    return {
      uri:
        Constants.manifest.bundleUrl.match(/^https?:\/\/.*?\//)[0] +
        meta.httpServerLocation.replace(/^\/?/, '') +
        suffix,
      hash,
    };
  }

  // CDN URI is based directly on the hash
  return {
    uri: 'https://d1wp6m56sqw74a.cloudfront.net/~assets/' + hash,
    hash,
  };
};

// Returns the uri of an asset from its hash and type or null if the asset is
// not included in the app bundle.
const getUriInBundle = (hash, type) => {
  const assetName = 'asset_' + hash + (type ? '.' + type : '');
  if (__DEV__ || Constants.appOwnership !== 'standalone' || !bundledAssets.has(assetName)) {
    return null;
  }
  return `${FS.bundleDirectory}${assetName}`;
};

export default class Asset {
  static byHash = {};

  constructor({ name, type, hash, uri, width, height }) {
    this.name = name;
    this.type = type;
    this.hash = hash;
    this.uri = uri;
    this.localUri = getUriInBundle(hash, type);
    if (typeof width === 'number') {
      this.width = width;
    }
    if (typeof height === 'number') {
      this.height = height;
    }

    this.downloading = false;
    this.downloaded = !!this.localUri;
    this.downloadCallbacks = [];
  }

  static loadAsync(moduleId) {
    let moduleIds = typeof moduleId === 'number' ? [moduleId] : moduleId;
    return Promise.all(moduleIds.map(m => Asset.fromModule(m).downloadAsync()));
  }

  static fromModule(moduleId) {
    const meta = AssetRegistry.getAssetByID(moduleId);
    return Asset.fromMetadata(meta);
  }

  static fromMetadata(meta) {
    // The hash of the whole asset, not to confuse with the hash of a specific
    // file returned from `pickScale`.
    const metaHash = meta.hash;
    if (Asset.byHash[metaHash]) {
      return Asset.byHash[metaHash];
    }

    const { uri, hash } = pickScale(meta);

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

  async downloadAsync() {
    if (this.downloaded) {
      return;
    }
    if (this.downloading) {
      await new Promise((resolve, reject) => this.downloadCallbacks.push({ resolve, reject }));
      return;
    }
    this.downloading = true;
    try {
      const localUri = `${FS.cacheDirectory}ExponentAsset-${this.hash}.${this.type}`;
      let exists, md5;
      ({ exists, md5 } = await FS.getInfoAsync(localUri, {
        cache: true,
        md5: true,
      }));
      if (!exists || md5 !== this.hash) {
        ({ md5 } = await FS.downloadAsync(this.uri, localUri, {
          cache: true,
          md5: true,
        }));
        if (md5 !== this.hash) {
          throw new Error(
            `Downloaded file for asset '${this.name}.${this.type}' ` +
              `Located at ${this.uri} ` +
              `failed MD5 integrity check`
          );
        }
      }

      this.localUri = localUri;
      this.downloaded = true;
      this.downloadCallbacks.forEach(({ resolve }) => resolve());
    } catch (e) {
      this.downloadCallbacks.forEach(({ reject }) => reject(e));
      throw e;
    } finally {
      this.downloading = false;
      this.downloadCallbacks = [];
    }
  }
}

// Override React Native's asset resolution for `Image` components
resolveAssetSource.setCustomSourceTransformer(resolver => {
  const asset = Asset.fromMetadata(resolver.asset);
  return resolver.fromSource(asset.downloaded ? asset.localUri : asset.uri);
});
