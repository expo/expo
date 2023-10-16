"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFontsAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const withFontsAndroid = (config, fonts) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const resolvedFonts = await (0, utils_1.resolveFontPaths)(fonts, config.modRequest.projectRoot);
            await Promise.all(resolvedFonts.map(async (asset) => {
                const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/assets/fonts');
                await promises_1.default.mkdir(fontsDir, { recursive: true });
                const output = path_1.default.join(fontsDir, path_1.default.basename(asset));
                await promises_1.default.copyFile(asset, output);
            }));
            return config;
        },
    ]);
};
exports.withFontsAndroid = withFontsAndroid;
