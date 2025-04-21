"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXmlFontsAndroid = exports.withFontsAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const codeMod_1 = require("@expo/config-plugins/build/android/codeMod");
const config_plugins_2 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const withFontsAndroid = (config, fonts) => {
    return (0, config_plugins_2.withDangerousMod)(config, [
        'android',
        async (config) => {
            const resolvedFonts = await (0, utils_1.resolveFontPaths)(fonts, config.modRequest.projectRoot);
            await Promise.all(resolvedFonts.map(async (asset) => {
                const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/assets/fonts');
                await promises_1.default.mkdir(fontsDir, { recursive: true });
                const output = path_1.default.join(fontsDir, path_1.default.basename(asset));
                if (output.endsWith('.ttf') || output.endsWith('.otf')) {
                    await promises_1.default.copyFile(asset, output);
                }
            }));
            return config;
        },
    ]);
};
exports.withFontsAndroid = withFontsAndroid;
const withXmlFontsAndroid = (config, fonts) => {
    return (0, config_plugins_1.withMainApplication)(config, async (config) => {
        const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');
        await promises_1.default.mkdir(fontsDir, { recursive: true });
        const modResults = config.modResults;
        const isJava = modResults.language === 'java';
        modResults.contents = (0, codeMod_1.addImports)(modResults.contents, ['com.facebook.react.common.assets.ReactFontManager'], isJava);
        Promise.all(fonts.map(async ({ fontName, files }) => {
            const xmlFileName = (0, utils_1.normalizeFilename)(fontName);
            const resolvedFonts = await (0, utils_1.resolveXmlFontPaths)(files, config.modRequest.projectRoot);
            const fontXml = (0, utils_1.generateFontFamilyXml)(resolvedFonts);
            const xmlPath = path_1.default.join(fontsDir, `${xmlFileName}.xml`);
            await promises_1.default.writeFile(xmlPath, fontXml);
            await Promise.all(resolvedFonts.map(async (file) => {
                const destPath = path_1.default.join(fontsDir, path_1.default.basename(file.font));
                await promises_1.default.copyFile(path_1.default.resolve(__dirname, file.font), destPath);
            }));
            modResults.contents = (0, codeMod_1.appendContentsInsideDeclarationBlock)(modResults.contents, 'onCreate', `  ReactFontManager.getInstance().addCustomFont(this, "${fontName}", R.font.${xmlFileName})${isJava ? ';' : ''}\n  `);
        }));
        return config;
    });
};
exports.withXmlFontsAndroid = withXmlFontsAndroid;
