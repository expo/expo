"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * @param packageName for example: `expo-image-picker` or `unimodules-constatns-interface`
 * @returns relative path to package's changelog. For example: `packages/expo-image-picker/CHANGELOG.md`
 */
function getPackageChangelogRelativePath(packageName) {
    return path.join('packages', packageName, 'CHANGELOG.md');
}
exports.getPackageChangelogRelativePath = getPackageChangelogRelativePath;
function getExpoRepositoryRootDir() {
    // EXPO_ROOT_DIR is set locally by direnv
    return process.env.EXPO_ROOT_DIR || path_1.join(__dirname, '..');
}
exports.getExpoRepositoryRootDir = getExpoRepositoryRootDir;
async function getFileContentAsync(path) {
    const buffer = await fs.promises.readFile(path);
    return buffer.toString();
}
exports.getFileContentAsync = getFileContentAsync;
//# sourceMappingURL=Utils.js.map