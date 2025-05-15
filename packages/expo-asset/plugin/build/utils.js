"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCEPTED_TYPES = exports.MEDIA_TYPES = exports.FONT_TYPES = exports.IMAGE_TYPES = void 0;
exports.resolveAssetPaths = resolveAssetPaths;
exports.validateAssets = validateAssets;
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
function validateAssets(assets) {
    return assets.filter((asset) => {
        const ext = path_1.default.extname(asset);
        const accepted = exports.ACCEPTED_TYPES.includes(ext);
        const isFont = exports.FONT_TYPES.includes(ext);
        if (!accepted) {
            console.warn(`\`${ext}\` is not a supported asset type`);
            return;
        }
        if (isFont) {
            console.warn(`Fonts are not supported with the \`expo-asset\` plugin. Use \`expo-font\` instead. Ignoring ${asset}`);
            return;
        }
        return asset;
    });
}
