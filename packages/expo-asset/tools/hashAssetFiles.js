// NOTE(Jan 17, 2025): This file is now deprecated in favor of `@expo/metro-config`. It should probably be removed for SDK 53.

'use strict';

const crypto = require('crypto');
const fs = require('fs');

// NOTE(Mar 5, 2025): Copied over from #34208 in case we won't be able to remove this file by the time SDK 53 is finalized.
function getMD5ForFilePathAsync(path) {
  return new Promise((resolve, reject) => {
    const output = crypto.createHash('md5');
    const input = fs.createReadStream(path);
    input.on('error', (err) => reject(err));
    output.on('error', (err) => reject(err));
    output.once('readable', () => resolve(output.read().toString('hex')));
    input.pipe(output);
  });
}

module.exports = function hashAssetFiles(asset) {
  return Promise.all(asset.files.map(getMD5ForFilePathAsync)).then((hashes) => {
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
