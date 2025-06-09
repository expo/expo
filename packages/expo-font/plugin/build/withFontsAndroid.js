"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withFontsAndroid = void 0;
exports.groupByFamily = groupByFamily;
exports.getXmlSpecs = getXmlSpecs;
exports.generateFontManagerCalls = generateFontManagerCalls;
const codeMod_1 = require("@expo/config-plugins/build/android/codeMod");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const config_plugins_1 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const assetsFontsFir = 'app/src/main/assets/fonts';
const resourcesFontsDir = 'app/src/main/res/font';
const withFontsAndroid = (config, fonts) => {
    const assetFontPaths = fonts.filter((it) => typeof it === 'string');
    config = copyFontsToDir(config, assetFontPaths, assetsFontsFir);
    const xmlFonts = fonts.filter((it) => typeof it === 'object');
    config = addXmlFonts(config, xmlFonts);
    return config;
};
exports.withFontsAndroid = withFontsAndroid;
function groupByFamily(array) {
    return array.reduce((result, item) => {
        const keyValue = item['fontFamily'];
        result[keyValue] ||= [];
        result[keyValue].push(...item.fontDefinitions);
        return result;
    }, {});
}
function addXmlFonts(config, xmlFontObjects) {
    const fontsByFamily = groupByFamily(xmlFontObjects);
    const fontPaths = Object.values(fontsByFamily)
        .map((font) => font.map((it) => it.path))
        .flat();
    config = copyFontsToDir(config, fontPaths, resourcesFontsDir, (filenameWithExt) => {
        const filename = (0, utils_1.toValidAndroidResourceName)(filenameWithExt);
        const ext = path_1.default.extname(filenameWithExt);
        return `${filename}${ext}`;
    });
    config = addFontXmlToMainApplication(config, fontsByFamily);
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, 'app/src/main/res/font');
            const xmlSpecs = getXmlSpecs(fontsDir, fontsByFamily);
            await Promise.all(xmlSpecs.map(config_plugins_1.XML.writeXMLAsync));
            return config;
        },
    ]);
}
const resourceNameConflictAvoidancePrefix = 'xml_';
function getXmlSpecs(fontsDir, xmlFontObjects) {
    return Object.entries(xmlFontObjects).map(([fontFamily, fontDefinitions]) => {
        const filePath = path_1.default.join(fontsDir, `${resourceNameConflictAvoidancePrefix + (0, utils_1.toValidAndroidResourceName)(fontFamily)}.xml`);
        // each font family has one xml resource file with potentially multiple font definitions
        // the font files (e.g. ttf) at `path` are copied to res/font
        // with their name changed to be a valid resource and referenced in the xml file
        return {
            path: filePath,
            xml: {
                'font-family': {
                    // using `app` namespace for better compat:
                    // https://developer.android.com/develop/ui/views/text-and-emoji/fonts-in-xml#using-support-lib
                    $: {
                        'xmlns:app': 'http://schemas.android.com/apk/res-auto',
                    },
                    font: fontDefinitions.map((definition) => {
                        return {
                            $: {
                                'app:font': `@font/${(0, utils_1.toValidAndroidResourceName)(definition.path)}`,
                                'app:fontStyle': definition.style || 'normal',
                                'app:fontWeight': String(definition.weight),
                            },
                        };
                    }),
                },
            },
        };
    });
}
function addFontXmlToMainApplication(config, xmlFontObjects) {
    return (0, config_plugins_1.withMainApplication)(config, (config) => {
        const { modResults, modResults: { language }, } = config;
        modResults.contents = (0, codeMod_1.addImports)(modResults.contents, ['com.facebook.react.common.assets.ReactFontManager'], language === 'java');
        const fontManagerCalls = generateFontManagerCalls(xmlFontObjects, language).join(os_1.default.EOL);
        const withInit = (0, generateCode_1.mergeContents)({
            src: modResults.contents,
            comment: '    //',
            tag: 'xml-fonts-init',
            offset: 1,
            anchor: /super\.onCreate\(\)/,
            newSrc: fontManagerCalls,
        });
        return {
            ...config,
            modResults: {
                ...modResults,
                contents: withInit.contents,
            },
        };
    });
}
function generateFontManagerCalls(xmlFontObjects, language) {
    const lineEnding = language === 'java' ? ';' : '';
    const indent = '    ';
    return Object.keys(xmlFontObjects).map((family) => `${indent}ReactFontManager.getInstance().addCustomFont(this, "${family}", R.font.${resourceNameConflictAvoidancePrefix + (0, utils_1.toValidAndroidResourceName)(family)})${lineEnding}`);
}
function copyFontsToDir(config, paths, inAppDestination, filenameProcessor = (filenameWithExt) => filenameWithExt) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const fontsDir = path_1.default.join(config.modRequest.platformProjectRoot, inAppDestination);
            await promises_1.default.mkdir(fontsDir, { recursive: true });
            const resolvedFonts = await (0, utils_1.resolveFontPaths)(paths, config.modRequest.projectRoot);
            await Promise.all(resolvedFonts.map(async (asset) => {
                const filenameWithExt = path_1.default.basename(asset);
                const outputFileName = filenameProcessor(filenameWithExt);
                const output = path_1.default.join(fontsDir, outputFileName);
                if (output.endsWith('.ttf') || output.endsWith('.otf')) {
                    await promises_1.default.copyFile(asset, output);
                }
            }));
            return config;
        },
    ]);
}
