const { loadMetroConfigAsync } = require('@expo/cli/build/src/start/server/metro/instantiateMetro');
const { resolveEntryPoint } = require('@expo/config/paths');
const crypto = require('crypto');
const fs = require('fs');
const Server = require('metro/src/Server');
const path = require('path');

const filterPlatformAssetScales = require('./filterPlatformAssetScales');

function findUpProjectRoot(cwd) {
  if (['.', path.sep].includes(cwd)) return null;

  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return cwd;
  } else {
    return findUpProjectRoot(path.dirname(cwd));
  }
}

/** Resolve the relative entry file using Expo's resolution method. */
function getRelativeEntryPoint(projectRoot, platform) {
  const entry = resolveEntryPoint(projectRoot, { platform });
  if (entry) {
    return path.relative(projectRoot, entry);
  }
  return entry;
}

(async function () {
  const platform = process.argv[2];
  const possibleProjectRoot = findUpProjectRoot(process.argv[3]);
  const destinationDir = process.argv[4];
  const entryFile =
    process.argv[5] ||
    process.env.ENTRY_FILE ||
    getRelativeEntryPoint(possibleProjectRoot, platform) ||
    'index.js';

  // Remove projectRoot validation when we no longer support React Native <= 62
  let projectRoot;
  if (fs.existsSync(path.join(possibleProjectRoot, entryFile))) {
    projectRoot = path.resolve(possibleProjectRoot);
  } else if (fs.existsSync(path.join(possibleProjectRoot, '..', entryFile))) {
    projectRoot = path.resolve(possibleProjectRoot, '..');
  } else {
    throw new Error(
      'Error loading application entry point. If your entry point is not index.js, please set ENTRY_FILE environment variable with your app entry point.'
    );
  }

  process.chdir(projectRoot);

  let metroConfig;
  try {
    // Load the metro config the same way it would be loaded in Expo CLI.
    // This ensures dynamic features like tsconfig paths can be used.
    metroConfig = (
      await loadMetroConfigAsync(projectRoot, {
        // No config options can be passed to this point.
      })
    ).config;
  } catch (e) {
    let message = `Error loading Metro config and Expo app config: ${e.message}\n\nMake sure your project is configured properly and your app.json / app.config.js is valid.`;
    if (process.env.EAS_BUILD) {
      message +=
        '\nIf you are using environment variables in app.config.js, verify that you have set them in your EAS Build profile configuration or secrets.';
    }
    throw new Error(message);
  }

  let assets;
  try {
    assets = await fetchAssetManifestAsync(platform, projectRoot, entryFile, metroConfig);
  } catch (e) {
    throw new Error(
      "Error loading assets JSON from Metro. Ensure you've followed all expo-updates installation steps correctly. " +
        e.message
    );
  }

  const manifest = {
    id: crypto.randomUUID(),
    commitTime: new Date().getTime(),
    assets: [],
  };

  assets.forEach(function (asset) {
    if (!asset.fileHashes) {
      throw new Error(
        'The hashAssetFiles Metro plugin is not configured. You need to add a metro.config.js to your project that configures Metro to use this plugin. See https://github.com/expo/expo/blob/main/packages/expo-updates/README.md#metroconfigjs for an example.'
      );
    }
    filterPlatformAssetScales(platform, asset.scales).forEach(function (scale, index) {
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
})().catch((e) => {
  // Wrap in regex to make it easier for log parsers (like `@expo/xcpretty`) to find this error.
  e.message = `@build-script-error-begin\n${e.message}\n@build-script-error-end\n`;
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
  const folderPath = getBasePath(asset);
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
  let basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}

// Spawn a Metro server to get the asset manifest
async function fetchAssetManifestAsync(platform, projectRoot, entryFile, metroConfig) {
  // Project-level babel config does not load unless we change to the
  // projectRoot before instantiating the server
  process.chdir(projectRoot);

  const server = new Server(metroConfig);

  const requestOpts = {
    entryFile,
    dev: false,
    minify: false,
    platform,
  };

  let assetManifest;
  let error;
  try {
    assetManifest = await server.getAssets({
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
    });
  } catch (e) {
    error = e;
  } finally {
    server.end();
  }

  if (error) {
    throw error;
  }

  return assetManifest;
}
