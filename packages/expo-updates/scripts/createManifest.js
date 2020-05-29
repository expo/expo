const fs = require('fs');
const http = require('http');
const path = require('path');
const uuid = require('uuid/v4');

const filterPlatformAssetScales = require('./filterPlatformAssetScales');

const platform = process.argv[2];
const packagerUrl = process.argv[3];
const destinationDir = process.argv[4];

(async function() {
  let assetsJson;
  try {
    assetsJson = await new Promise(function(resolve, reject) {
      const req = http.get(packagerUrl, function(res) {
        if (res.statusCode !== 200) {
          reject(new Error('Request to packager server failed: ' + res.statusCode));
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', function(chunk) {
          rawData += chunk;
        });
        res.on('end', function() {
          resolve(rawData);
        });
      });

      req.on('error', function(error) {
        reject(error);
      });

      req.end();
    });
  } catch (e) {
    throw new Error(
      `Failed to connect to the packager server. If you did not start this build by running 'react-native run-android', you can start the packager manually by running 'react-native start' in the project directory. (Error: ${e.message})`
    );
  }

  let assets;
  try {
    assets = JSON.parse(assetsJson);
  } catch (e) {
    throw new Error(
      "Error parsing assets JSON from React Native packager. Ensure you've followed all expo-updates installation steps correctly. " +
        e.message
    );
  }

  const manifest = {
    id: uuid(),
    commitTime: new Date().getTime(),
    assets: [],
  };

  assets.forEach(function(asset) {
    if (!asset.fileHashes) {
      throw new Error(
        'The hashAssetFiles Metro plugin is not configured. You need to add a metro.config.js to your project that configures Metro to use this plugin. See https://github.com/expo/expo/blob/master/packages/expo-updates/README.md#metroconfigjs for an example.'
      );
    }
    filterPlatformAssetScales(platform, asset.scales).forEach(function(scale, index) {
      const assetInfoForManifest = {
        name: asset.name,
        type: asset.type,
        scale,
        packagerHash: asset.fileHashes[index],
        subdirectory: asset.httpServerLocation,
      };
      if (platform === 'ios') {
        assetInfoForManifest.nsBundleDir = getIosDestinationDir(asset);
        assetInfoForManifest.nsBundleFilename =
          scale === 1 ? asset.name : asset.name + '@' + scale + 'x';
      } else if (platform === 'android') {
        assetInfoForManifest.scales = asset.scales;
        assetInfoForManifest.resourcesFilename = getAndroidResourceIdentifier(asset);
        assetInfoForManifest.resourcesFolder = getAndroidResourceFolderName(asset);
      }
      manifest.assets.push(assetInfoForManifest);
    });
  });

  fs.writeFileSync(path.join(destinationDir, 'app.manifest'), JSON.stringify(manifest));
})().catch(e => {
  console.error(e);
  process.exit(1);
});

// See https://developer.android.com/guide/topics/resources/drawable-resource.html
const drawableFileTypes = new Set(['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp', 'xml']);
function getAndroidResourceFolderName(asset) {
  return drawableFileTypes.has(asset.type) ? 'drawable' : 'raw';
}

// copied from react-native/Libraries/Image/assetPathUtils.js
function getAndroidResourceIdentifier(asset) {
  var folderPath = getBasePath(asset);
  return (folderPath + '/' + asset.name)
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getIosDestinationDir(asset) {
  // react-native-cli replaces `..` with `_` when embedding assets in the iOS app bundle
  // https://github.com/react-native-community/cli/blob/0a93be1a42ed1fb05bb0ebf3b82d58b2dd920614/packages/cli/src/commands/bundle/getAssetDestPathIOS.ts
  return getBasePath(asset).replace(/\.\.\//g, '_');
}

// copied from react-native/Libraries/Image/assetPathUtils.js
function getBasePath(asset) {
  var basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}
