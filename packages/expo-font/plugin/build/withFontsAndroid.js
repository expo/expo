"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFontsAndroid = void 0;
const codeMod_1 = require("@expo/config-plugins/build/android/codeMod");
const config_plugins_1 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const withFontsAndroid = (config, fonts) => {
    config = addFontsInDir(config, fonts);
    config = appendCustomFontCodeToMainApp(config, fonts);
    return config;
};
exports.withFontsAndroid = withFontsAndroid;
function appendCustomFontCodeToMainApp(config, fonts) {
    const fontObjects = fonts.filter((f) => typeof f !== 'string');
    const fontsByFamily = (0, utils_1.groupBy)(fontObjects, 'family');
    config = addFontXmlToMainApplication(config, Object.keys(fontsByFamily));
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');
            await Promise.all(Object.values(fontsByFamily).map((fonts) => {
                return config_plugins_1.XML.writeXMLAsync({
                    path: path_1.default.join(fontsDir, `${(0, utils_1.toAndroidResourceString)(fonts[0].family)}.xml`),
                    xml: {
                        'font-family': {
                            $: {
                                'xmlns:app': 'http://schemas.android.com/apk/res-auto',
                            },
                            font: fonts.map((font) => ({
                                $: {
                                    'app:fontStyle': font.style || 'normal',
                                    'app:fontWeight': font.weight,
                                    'app:font': `@font/${path_1.default.parse(font.path).name}`,
                                },
                            })),
                        },
                    },
                });
            }));
            return config;
        },
    ]);
}
function fontManagerCode(family) {
    return `ReactFontManager.getInstance().addCustomFont(this, "${family}", R.font.${(0, utils_1.toAndroidResourceString)(family)});`;
}
function addFontXmlToMainApplication(config, families) {
    return (0, config_plugins_1.withMainApplication)(config, async (config) => {
        config.modResults.contents = (0, codeMod_1.addImports)(config.modResults.contents, ['com.facebook.react.common.assets.ReactFontManager'], config.modResults.language === 'java');
        config.modResults.contents = (0, codeMod_1.appendContentsInsideDeclarationBlock)(config.modResults.contents, 'onCreate', families.map(fontManagerCode).join('\n'));
        return config;
    });
}
function addFontsInDir(config, fonts) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const paths = fonts.map((font) => (typeof font === 'string' ? font : font.path));
            const resolvedFonts = await (0, utils_1.resolveFontPaths)(paths, config.modRequest.projectRoot);
            const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/assets/fonts');
            await promises_1.default.mkdir(fontsDir, { recursive: true });
            await Promise.all(resolvedFonts.map(async (asset) => {
                const output = path_1.default.join(fontsDir, path_1.default.basename(asset));
                if (output.endsWith('.ttf') || output.endsWith('.otf')) {
                    await promises_1.default.copyFile(asset, output);
                }
            }));
            return config;
        },
    ]);
}
