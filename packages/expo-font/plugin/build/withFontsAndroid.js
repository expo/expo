"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFontsAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const withFontsAndroid = (config, fonts) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        (config) => {
            (fonts || []).forEach((asset) => {
                const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/assets/fonts');
                fs_1.default.mkdirSync(fontsDir, { recursive: true });
                const output = path_1.default.join(fontsDir, path_1.default.basename(asset));
                fs_1.default.copyFileSync(asset, output);
            });
            return config;
        },
    ]);
};
exports.withFontsAndroid = withFontsAndroid;
