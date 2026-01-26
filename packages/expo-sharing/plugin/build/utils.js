"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateFilesPath = getTemplateFilesPath;
exports.getSharedFilesPath = getSharedFilesPath;
const path_1 = __importDefault(require("path"));
function getTemplateFilesPath(platform) {
    const packagePath = path_1.default.dirname(require.resolve('expo-sharing/package.json'));
    return path_1.default.join(packagePath, '/plugin/template-files/ios');
}
function getSharedFilesPath() {
    const packagePath = path_1.default.dirname(require.resolve('expo-sharing/package.json'));
    return path_1.default.join(packagePath, '/ios/shared');
}
