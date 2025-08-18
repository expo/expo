"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCEPTED_TYPES = exports.MEDIA_TYPES = exports.FONT_TYPES = exports.IMAGE_TYPES = void 0;
exports.resolveAssetPaths = resolveAssetPaths;
exports.validateAssets = validateAssets;
const config_plugins_1 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
exports.IMAGE_TYPES = ['.png', '.jpg', '.gif'];
exports.FONT_TYPES = ['.otf', '.ttf'];
exports.MEDIA_TYPES = ['.mp4', '.mp3', '.lottie', '.riv'];
exports.ACCEPTED_TYPES = ['.json', '.db', ...exports.IMAGE_TYPES, ...exports.MEDIA_TYPES, ...exports.FONT_TYPES];
async function resolveAssetPaths(assets, projectRoot) {
    const promises = assets.map(async (p) => {
        const resolvedPath = path_1.default.resolve(projectRoot, p);
        const stat = await promises_1.default.stat(resolvedPath);
        if (stat.isDirectory()) {
            const dir = await promises_1.default.readdir(resolvedPath);
            return dir.map((file) => path_1.default.join(resolvedPath, file));
        }
        return [resolvedPath];
    });
    return (await Promise.all(promises)).flat();
}
const validPattern = /^[a-z0-9_]+$/;
function isAndroidAssetNameValid(assetName) {
    return validPattern.test(assetName);
}
function validateAssets(assets, platform) {
    return assets.filter((asset) => {
        const ext = path_1.default.extname(asset);
        const name = path_1.default.basename(asset, ext);
        const isNameValid = platform === 'android' ? isAndroidAssetNameValid(name) : true;
        const accepted = exports.ACCEPTED_TYPES.includes(ext);
        const isFont = exports.FONT_TYPES.includes(ext);
        if (!isNameValid) {
            config_plugins_1.WarningAggregator.addWarningForPlatform(platform, 'expo-asset', `\`${name}\` is not a supported asset name - file-based resource names must contain only lowercase a-z, 0-9, or underscore`);
            return;
        }
        if (!accepted) {
            config_plugins_1.WarningAggregator.addWarningForPlatform(platform, 'expo-asset', `\`${ext}\` is not a supported asset type`);
            return;
        }
        if (isFont) {
            config_plugins_1.WarningAggregator.addWarningForPlatform(platform, 'expo-asset', `Fonts are not supported with the \`expo-asset\` plugin. Use \`expo-font\` instead. Ignoring ${asset}`);
            return;
        }
        return asset;
    });
}
