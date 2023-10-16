"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFontsIos = void 0;
const config_plugins_1 = require("expo/config-plugins");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const withFontsIos = (config, fonts) => {
    config = addFontsToTarget(config, fonts);
    config = addFontsToPlist(config, fonts);
    return config;
};
exports.withFontsIos = withFontsIos;
function addFontsToTarget(config, fonts) {
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        const resolvedFonts = await (0, utils_1.resolveFontPaths)(fonts, config.modRequest.projectRoot);
        const project = config.modResults;
        const platformProjectRoot = config.modRequest.platformProjectRoot;
        config_plugins_1.IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
        addResourceFile(project, platformProjectRoot, resolvedFonts);
        return config;
    });
}
function addFontsToPlist(config, fonts) {
    return (0, config_plugins_1.withInfoPlist)(config, async (config) => {
        const resolvedFonts = await (0, utils_1.resolveFontPaths)(fonts, config.modRequest.projectRoot);
        const existingFonts = getUIAppFonts(config.modResults);
        const fontList = resolvedFonts.map((font) => path_1.default.basename(font)) ?? [];
        const allFonts = [...existingFonts, ...fontList];
        config.modResults.UIAppFonts = Array.from(new Set(allFonts));
        return config;
    });
}
function addResourceFile(project, platformRoot, f) {
    for (const font of f) {
        const fontPath = path_1.default.relative(platformRoot, font);
        config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
            filepath: fontPath,
            groupName: 'Resources',
            project,
            isBuildFile: true,
            verbose: true,
        });
    }
}
function getUIAppFonts(infoPlist) {
    const fonts = infoPlist['UIAppFonts'];
    if (fonts != null && Array.isArray(fonts) && fonts.every((font) => typeof font === 'string')) {
        return fonts;
    }
    return [];
}
