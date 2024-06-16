"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniversalAssetData = void 0;
const Assets_1 = require("metro/src/Assets");
const js_1 = require("metro/src/DeltaBundler/Serializers/helpers/js");
const node_assert_1 = __importDefault(require("node:assert"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_path_1 = __importDefault(require("node:path"));
function md5Hash(data) {
    if (data.length === 1)
        return data[0];
    const hash = node_crypto_1.default.createHash('md5');
    hash.update(data.join(''));
    return hash.digest('hex');
}
function assertHashedAssetData(data) {
    (0, node_assert_1.default)('fileHashes' in data, 'Assets must have hashed files. Ensure the expo-asset plugin is installed.');
}
async function getUniversalAssetData(assetPath, localPath, assetDataPlugins, platform, publicPath) {
    const data = await (0, Assets_1.getAssetData)(assetPath, localPath, assetDataPlugins, platform, publicPath);
    assertHashedAssetData(data);
    // NOTE(EvanBacon): This is where we modify the asset to include a hash in the name for web cache invalidation.
    if (platform === 'web' && publicPath.includes('?export_path=')) {
        // `local-image.[contenthash]`. Using `.` but this won't work if we ever apply to Android because Android res files cannot contain `.`.
        // TODO: Prevent one multi-res image from updating the hash in all images.
        // @ts-expect-error: name is typed as readonly.
        data.name = `${data.name}.${md5Hash(data.fileHashes)}`;
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