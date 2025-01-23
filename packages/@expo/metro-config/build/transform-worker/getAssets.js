"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniversalAssetData = void 0;
const Assets_1 = require("metro/src/Assets");
const js_1 = require("metro/src/DeltaBundler/Serializers/helpers/js");
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const debug = require('debug')('expo:metro-config:assets');
function getMD5ForData(data) {
    if (data.length === 1)
        return data[0];
    const hash = node_crypto_1.default.createHash('md5');
    hash.update(data.join(''));
    return hash.digest('hex');
}
function getMD5ForFilePathAsync(path) {
    return new Promise((resolve, reject) => {
        const output = node_crypto_1.default.createHash('md5');
        const input = node_fs_1.default.createReadStream(path);
        input.on('error', (err) => reject(err));
        output.on('error', (err) => reject(err));
        output.once('readable', () => resolve(output.read().toString('hex')));
        input.pipe(output);
    });
}
function isHashedAssetData(asset) {
    if ('fileHashes' in asset && Array.isArray(asset.fileHashes)) {
        return true;
    }
    return false;
}
async function ensureOtaAssetHashesAsync(asset) {
    // Legacy cases where people have the `expo-asset/tools/hashAssetFiles` set still.
    if (isHashedAssetData(asset)) {
        debug('fileHashes already added, skipping injection for: ' + asset.name);
        return asset;
    }
    const hashes = await Promise.all(asset.files.map(getMD5ForFilePathAsync));
    // New version where we run the asset plugin every time.
    asset.fileHashes = hashes;
    // Convert the `../` segments of the server URL to `_` to support monorepos.
    // This same transformation takes place in `AssetSourceResolver.web` (expo-assets, expo-image) and `persistMetroAssets` of Expo CLI,
    // this originally came from the Metro opinion https://github.com/react-native-community/cli/blob/2204d357379e2067cebe2791e90388f7e97fc5f5/packages/cli-plugin-metro/src/commands/bundle/getAssetDestPathIOS.ts#L19C5-L19C10
    if (asset.httpServerLocation.includes('?export_path=')) {
        // @ts-expect-error: marked as read-only
        asset.httpServerLocation = asset.httpServerLocation
            .match(/\?export_path=(.*)/)[1]
            .replace(/\.\.\//g, '_');
    }
    // URL encode asset paths defined as `?export_path` or `?unstable_path` query parameters.
    // Decoding should be done automatically when parsing the URL through Node or the browser.
    const assetPathQueryParameter = asset.httpServerLocation.match(/\?(export_path|unstable_path)=(.*)/);
    if (assetPathQueryParameter && assetPathQueryParameter[2]) {
        const assetPath = assetPathQueryParameter[2];
        // @ts-expect-error: marked as read-only
        asset.httpServerLocation = asset.httpServerLocation.replace(assetPath, encodeURIComponent(assetPath));
    }
    return asset;
}
async function getUniversalAssetData(assetPath, localPath, assetDataPlugins, platform, publicPath) {
    const metroAssetData = await (0, Assets_1.getAssetData)(assetPath, localPath, assetDataPlugins, platform, publicPath);
    const data = await ensureOtaAssetHashesAsync(metroAssetData);
    // NOTE(EvanBacon): This is where we modify the asset to include a hash in the name for web cache invalidation.
    if (platform === 'web' && publicPath.includes('?export_path=')) {
        // `local-image.[contenthash]`. Using `.` but this won't work if we ever apply to Android because Android res files cannot contain `.`.
        // TODO: Prevent one multi-res image from updating the hash in all images.
        // @ts-expect-error: name is typed as readonly.
        data.name = `${data.name}.${getMD5ForData(data.fileHashes)}`;
    }
    return data;
}
exports.getUniversalAssetData = getUniversalAssetData;
async function getAssets(dependencies, options) {
    const promises = [];
    const { processModuleFilter } = options;
    for (const module of dependencies.values()) {
        if ((0, js_1.isJsModule)(module) &&
            processModuleFilter(module) &&
            (0, js_1.getJsOutput)(module).type === 'js/module/asset' &&
            node_path_1.default.relative(options.projectRoot, module.path) !== 'package.json') {
            promises.push(getUniversalAssetData(module.path, node_path_1.default.relative(options.projectRoot, module.path), options.assetPlugins, options.platform, options.publicPath));
        }
    }
    return await Promise.all(promises);
}
exports.default = getAssets;
//# sourceMappingURL=getAssets.js.map