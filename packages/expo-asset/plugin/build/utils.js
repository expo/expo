"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAssets = exports.resolveAssetPaths = exports.ACCEPTED_TYPES = exports.mediaTypes = exports.fontTypes = exports.imageTypes = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
exports.imageTypes = ['.png', '.jpg', '.gif'];
exports.fontTypes = ['.otf', '.ttf'];
exports.mediaTypes = ['.mp4', '.mp3'];
exports.ACCEPTED_TYPES = ['.json', '.db', ...exports.imageTypes, ...exports.mediaTypes, ...exports.fontTypes];
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
exports.resolveAssetPaths = resolveAssetPaths;
function validateAssets(assets) {
    return assets?.filter((asset) => {
        const ext = path_1.default.extname(asset);
        const accepted = exports.ACCEPTED_TYPES.includes(ext);
        if (!accepted) {
            console.warn(`\`${ext}\` is not a supported asset type`);
            return;
        }
        return asset;
    });
}
exports.validateAssets = validateAssets;
