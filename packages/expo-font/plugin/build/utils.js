"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFontFamilyXml = exports.normalizeFilename = exports.resolveXmlFontPaths = exports.resolveFontPaths = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
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
exports.resolveFontPaths = resolveFontPaths;
async function resolveXmlFontPaths(fonts, projectRoot) {
    const promises = fonts.map(async (p) => {
        const resolvedPath = path_1.default.resolve(projectRoot, p.font);
        const stat = await promises_1.default.stat(resolvedPath);
        if (stat.isDirectory()) {
            const dir = await promises_1.default.readdir(resolvedPath);
            return dir.map((file) => ({ ...p, font: path_1.default.join(resolvedPath, file) }));
        }
        return [{ ...p, font: resolvedPath }];
    });
    return (await Promise.all(promises))
        .flat()
        .filter((p) => p.font.endsWith('.ttf') ||
        p.font.endsWith('.otf') ||
        p.font.endsWith('.woff') ||
        p.font.endsWith('.woff2'));
}
exports.resolveXmlFontPaths = resolveXmlFontPaths;
function normalizeFilename(filename) {
    return filename
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}
exports.normalizeFilename = normalizeFilename;
function generateFontFamilyXml(files) {
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<font-family xmlns:app="http://schemas.android.com/apk/res-auto">\n`;
    files.forEach((file) => {
        const filename = normalizeFilename(path_1.default.basename(file.font, path_1.default.extname(file.font)));
        xml += `    <font`;
        if (file.fontStyle) {
            xml += ` app:fontStyle="${file.fontStyle}"`;
        }
        if (file.fontWeight) {
            xml += ` app:fontWeight="${file.fontWeight}"`;
        }
        xml += ` app:font="@font/${filename}" />\n`;
    });
    xml += `</font-family>\n`;
    return xml;
}
exports.generateFontFamilyXml = generateFontFamilyXml;
