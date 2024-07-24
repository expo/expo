'use strict';

const md5File = require('md5-file/promise');

module.exports = function hashAssetFiles(asset) {
  return Promise.all(asset.files.map(md5File)).then((hashes) => {
    asset.fileHashes = hashes;

    // Convert the `../` segments of the server URL to `_` to support monorepos.
    // This same transformation takes place in `AssetSourceResolver.web` (expo-assets, expo-image) and `persistMetroAssets` of Expo CLI,
    // this originally came from the Metro opinion https://github.com/react-native-community/cli/blob/2204d357379e2067cebe2791e90388f7e97fc5f5/packages/cli-plugin-metro/src/commands/bundle/getAssetDestPathIOS.ts#L19C5-L19C10
    if (asset.httpServerLocation.includes('?export_path=')) {
      asset.httpServerLocation = asset.httpServerLocation
        .match(/\?export_path=(.*)/)[1]
        .replace(/\.\.\//g, '_');
    }

    // URL encode asset paths defined as `?export_path` or `?unstable_path` query parameters.
    // Decoding should be done automatically when parsing the URL through Node or the browser.
    const assetPathQueryParameter = asset.httpServerLocation.match(
      /\?(export_path|unstable_path)=(.*)/
    );
    if (assetPathQueryParameter && assetPathQueryParameter[2]) {
      const assetPath = assetPathQueryParameter[2];
      asset.httpServerLocation = asset.httpServerLocation.replace(
        assetPath,
        encodeURIComponent(assetPath)
      );
    }

    return asset;
  });
};
