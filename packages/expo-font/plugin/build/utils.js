"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toValidAndroidResourceName = toValidAndroidResourceName;
exports.resolveFontPaths = resolveFontPaths;
const promises_1 = __importDefault(require("fs/promises"));
const node_module_1 = __importDefault(require("node:module"));
const path_1 = __importDefault(require("path"));
function isErrorWithCode(error, code) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
function resolveFontPath(p, projectRoot) {
    return node_module_1.default.createRequire(path_1.default.join(projectRoot, 'package.json')).resolve(p);
}
// rule: File-based resource names must contain only lowercase a-z, 0-9, or underscore
function toValidAndroidResourceName(value) {
    const valueWithoutFileExtension = path_1.default.parse(value).name;
    const withUnderscores = valueWithoutFileExtension
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2');
    return withUnderscores
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_');
}
async function resolveFontPaths(fonts, projectRoot) {
    const promises = fonts.map(async (p) => {
        let resolvedPath = path_1.default.resolve(projectRoot, p);
        let stat;
        try {
            stat = await promises_1.default.stat(resolvedPath);
        }
        catch (error) {
            if (!isErrorWithCode(error, 'ENOENT')) {
                throw error;
            }
            resolvedPath = resolveFontPath(p, projectRoot);
            stat = await promises_1.default.stat(resolvedPath);
        }
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
