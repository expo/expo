"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFontFamilyXml = exports.getFontWeight = exports.resolveFontPaths = void 0;
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
const weightMap = {
    thin: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    regular: 400,
    normal: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
};
function getFontWeight(filename) {
    for (const weight in weightMap) {
        if (filename.toLowerCase().includes(weight)) {
            return weightMap[weight];
        }
    }
    return 400;
}
exports.getFontWeight = getFontWeight;
function generateFontFamilyXml(files) {
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n<font-family xmlns:app="http://schemas.android.com/apk/res-auto">\n`;
    files.forEach((file) => {
        const filename = path_1.default.basename(file, path_1.default.extname(file));
        const fontWeight = getFontWeight(filename);
        const fontStyle = filename.toLowerCase().includes('italic') ? 'italic' : 'normal';
        xml += `    <font app:fontStyle="${fontStyle}" app:fontWeight="${fontWeight}" app:font="@font/${filename}" />\n`;
    });
    xml += `</font-family>\n`;
    return xml;
}
exports.generateFontFamilyXml = generateFontFamilyXml;
