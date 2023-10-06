"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFontsIos = void 0;
const config_plugins_1 = require("expo/config-plugins");
const path_1 = __importDefault(require("path"));
const withFontsIos = (config, fonts) => {
    config = addFontsToTarget(config, fonts);
    config = addFontsToPlist(config, fonts);
    return config;
};
exports.withFontsIos = withFontsIos;
function addFontsToTarget(config, fonts) {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        const project = config.modResults;
        const platformProjectRoot = config.modRequest.platformProjectRoot;
        config_plugins_1.IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
        addResourceFile(project, platformProjectRoot, fonts);
        return config;
    });
}
function addFontsToPlist(config, fonts) {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        // @ts-ignore Type mismatch with the lib
        const existingFonts = config.modResults.UIAppFonts || [];
        const fontList = fonts.map((font) => path_1.default.basename(font)) ?? [];
        const allFonts = [
            // @ts-expect-error
            ...existingFonts,
            ...fontList,
        ];
        // @ts-ignore Type mismatch with the lib
        config.modResults.UIAppFonts = Array.from(new Set(allFonts));
        return config;
    });
}
function addResourceFile(project, platformRoot, f) {
    return (f ?? [])
        .map((font) => {
        const fontPath = path_1.default.relative(platformRoot, font);
        return project.addResourceFile(fontPath, {
            target: project.getFirstTarget().uuid,
        });
    })
        .filter(Boolean)
        .map((file) => file.basename);
}
