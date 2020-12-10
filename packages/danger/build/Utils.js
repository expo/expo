"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileContentAsync = exports.getExpoRepositoryRootDir = exports.getPackageChangelogRelativePath = void 0;
const fs = __importStar(require("fs"));
const path_1 = require("path");
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
    return process.env.EXPO_ROOT_DIR || path_1.join(__dirname, '../../..');
}
exports.getExpoRepositoryRootDir = getExpoRepositoryRootDir;
async function getFileContentAsync(path) {
    const buffer = await fs.promises.readFile(path);
    return buffer.toString();
}
exports.getFileContentAsync = getFileContentAsync;
//# sourceMappingURL=Utils.js.map