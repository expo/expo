"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManifestForBuildAsync = void 0;
const exportEmbedAsync_1 = require("@expo/cli/build/src/export/embed/exportEmbedAsync");
const metroAssetLocalPath_1 = require("@expo/cli/build/src/export/metroAssetLocalPath");
const paths_1 = require("@expo/config/paths");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const filterPlatformAssetScales_1 = require("./filterPlatformAssetScales");
async function createManifestForBuildAsync(platform, possibleProjectRoot, destinationDir, entryFileArg) {
    const entryFile = entryFileArg ||
        process.env.ENTRY_FILE ||
        getRelativeEntryPoint(possibleProjectRoot, platform) ||
        'index.js';
    // Remove projectRoot validation when we no longer support React Native <= 62
    let projectRoot;
    if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, entryFile))) {
        projectRoot = path_1.default.resolve(possibleProjectRoot);
    }
    else if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, '..', entryFile))) {
        projectRoot = path_1.default.resolve(possibleProjectRoot, '..');
    }
    else {
        throw new Error('Error loading application entry point. If your entry point is not index.js, please set ENTRY_FILE environment variable with your app entry point.');
    }
    process.chdir(projectRoot);
    const options = {
        platform,
        entryFile,
        minify: false,
        dev: process.env.CONFIGURATION === 'Debug',
        sourcemapUseAbsolutePath: false,
    };
    const { server, bundleRequest } = (await (0, exportEmbedAsync_1.createMetroServerAndBundleRequestAsync)(projectRoot, options));
    let assets;
    try {
        assets = await (0, exportEmbedAsync_1.exportEmbedAssetsAsync)(server, bundleRequest, projectRoot, options);
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
exports.createManifestForBuildAsync = createManifestForBuildAsync;
/**
 * Resolve the relative entry file using Expo's resolution method.
 */
function getRelativeEntryPoint(projectRoot, platform) {
    const entry = (0, paths_1.resolveEntryPoint)(projectRoot, { platform });
    if (entry) {
        return path_1.default.relative(projectRoot, entry);
    }
    return entry;
}
function getAndroidResourceFolderName(asset) {
    return metroAssetLocalPath_1.drawableFileTypes.has(asset.type) ? 'drawable' : 'raw';
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
