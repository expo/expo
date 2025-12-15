"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManifestForBuildAsync = createManifestForBuildAsync;
const crypto_1 = __importDefault(require("crypto"));
const paths_1 = require("expo/config/paths");
const unstable_expo_updates_cli_exports_1 = require("expo/internal/unstable-expo-updates-cli-exports");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const filterPlatformAssetScales_1 = require("./filterPlatformAssetScales");
async function createManifestForBuildAsync(platform, projectRoot, destinationDir, entryFileArg) {
    let entryFile = entryFileArg ||
        process.env.ENTRY_FILE ||
        (0, paths_1.resolveRelativeEntryPoint)(projectRoot, { platform }) ||
        'index.js';
    // Android uses absolute paths for the entry file, so we need to convert that to a relative path.
    if (path_1.default.isAbsolute(entryFile)) {
        entryFile = (0, paths_1.convertEntryPointToRelative)(projectRoot, entryFile);
    }
    process.chdir(projectRoot);
    const options = {
        platform,
        entryFile,
        minify: false,
        dev: process.env.CONFIGURATION === 'Debug', // ensures debug assets packaged correctly for iOS and native debug
        sourcemapUseAbsolutePath: false,
        resetCache: false,
    };
    const { server, bundleRequest } = await (0, unstable_expo_updates_cli_exports_1.createMetroServerAndBundleRequestAsync)(projectRoot, options);
    let assets;
    try {
        assets = await (0, unstable_expo_updates_cli_exports_1.exportEmbedAssetsAsync)(server, bundleRequest, projectRoot, options);
    }
    catch (e) {
        throw new Error("Error loading assets JSON from Metro. Ensure you've followed all expo-updates installation steps correctly. " +
            e.message);
    }
    finally {
        server.end();
    }
    const manifest = {
        id: crypto_1.default.randomUUID(),
        commitTime: new Date().getTime(),
        assets: [],
    };
    assets.forEach(function (asset) {
        if (!asset.fileHashes) {
            throw new Error('The hashAssetFiles Metro plugin is not configured. You need to add a metro.config.js to your project that configures Metro to use this plugin. See https://github.com/expo/expo/blob/main/packages/expo-updates/README.md#metroconfigjs for an example.');
        }
        (0, filterPlatformAssetScales_1.filterPlatformAssetScales)(platform, asset.scales).forEach(function (scale, index) {
            const baseAssetInfoForManifest = {
                name: asset.name,
                type: asset.type,
                scale,
                packagerHash: asset.fileHashes[index],
                subdirectory: asset.httpServerLocation,
            };
            if (platform === 'ios') {
                manifest.assets.push({
                    ...baseAssetInfoForManifest,
                    nsBundleDir: getIosDestinationDir(asset),
                    nsBundleFilename: scale === 1 ? asset.name : asset.name + '@' + scale + 'x',
                });
            }
            else if (platform === 'android') {
                manifest.assets.push({
                    ...baseAssetInfoForManifest,
                    scales: asset.scales,
                    resourcesFilename: getAndroidResourceIdentifier(asset),
                    resourcesFolder: getAndroidResourceFolderName(asset),
                });
            }
        });
    });
    fs_1.default.writeFileSync(path_1.default.join(destinationDir, 'app.manifest'), JSON.stringify(manifest));
}
function getAndroidResourceFolderName(asset) {
    return unstable_expo_updates_cli_exports_1.drawableFileTypes.has(asset.type) ? 'drawable' : 'raw';
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
