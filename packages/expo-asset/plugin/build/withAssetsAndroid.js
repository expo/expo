"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAssetsAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const withAssetsAndroid = (config, assets) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const resolvedAssets = await (0, utils_1.resolveAssetPaths)(assets, config.modRequest.projectRoot);
            const validAssets = (0, utils_1.validateAssets)(resolvedAssets, 'android');
            validAssets.forEach((asset) => {
                const assetsDir = getAssetDir(asset, config.modRequest.platformProjectRoot);
                fs_1.default.mkdirSync(assetsDir, { recursive: true });
            });
            await Promise.all(validAssets.map(async (asset) => {
                const assetsDir = getAssetDir(asset, config.modRequest.platformProjectRoot);
                const output = path_1.default.join(assetsDir, path_1.default.basename(asset));
                await promises_1.default.copyFile(asset, output);
            }));
            return config;
        },
    ]);
};
exports.withAssetsAndroid = withAssetsAndroid;
function getAssetDir(asset, root) {
    const assetPath = ['app', 'src', 'main', 'assets'];
    const resPath = ['app', 'src', 'main', 'res'];
    const ext = path_1.default.extname(asset);
    if (utils_1.IMAGE_TYPES.includes(ext)) {
        return path_1.default.join(root, ...resPath, 'drawable');
    }
    else if (utils_1.FONT_TYPES.includes(ext)) {
        return path_1.default.join(root, ...assetPath, 'fonts');
    }
    else if (utils_1.MEDIA_TYPES.includes(ext)) {
        return path_1.default.join(root, ...resPath, 'raw');
    }
    else {
        return path_1.default.join(root, ...assetPath);
    }
}
