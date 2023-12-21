"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAndroidResourceString = toAndroidResourceString;
exports.resolveFontPaths = resolveFontPaths;
exports.groupBy = groupBy;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
function toAndroidResourceString(string) {
    return string.replace(/(-| )/, '_').toLowerCase();
}
async function resolveFontPaths(fonts, projectRoot) {
    const promises = fonts.map(async (p) => {
        const resolvedPath = path_1.default.resolve(projectRoot, p);
        const stat = await promises_1.default.stat(resolvedPath);
        if (stat.isDirectory()) {
            const dir = await promises_1.default.readdir(resolvedPath);
            return dir.map((file) => path_1.default.join(resolvedPath, file));
        }
        return [resolvedPath];
    });
    return (await Promise.all(promises))
        .flat()
        .filter((p) => p.endsWith('.ttf') || p.endsWith('.otf') || p.endsWith('.woff') || p.endsWith('.woff2'));
}
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const keyValue = item[key];
        result[keyValue] = result[keyValue] || [];
        result[keyValue].push(item);
        return result;
    }, {});
}
