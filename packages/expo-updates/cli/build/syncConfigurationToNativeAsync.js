"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncConfigurationToNativeAsync = void 0;
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const plist_1 = __importDefault(require("@expo/plist"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Log = __importStar(require("./utils/log"));
/**
 * Synchronize updates configuration to native files. This needs to do essentially the same thing as `withUpdates`
 */
async function syncConfigurationToNativeAsync(options) {
    if (options.workflow !== 'generic') {
        // not applicable to managed workflow
        return;
    }
    switch (options.platform) {
        case 'android':
            await syncConfigurationToNativeAndroidAsync(options);
            break;
        case 'ios':
            await syncConfigurationToNativeIosAsync(options);
            break;
        default:
            Log.warn(`expo-updates does not yet implement syncConfigurationToNativeAsync() for platform "${options.platform}". Shall no-op.`);
    }
}
exports.syncConfigurationToNativeAsync = syncConfigurationToNativeAsync;
async function syncConfigurationToNativeAndroidAsync(options) {
    const { exp } = (0, config_1.getConfig)(options.projectRoot, {
        isPublicConfig: false,
        skipSDKVersionRequirement: true,
    });
    const packageVersion = require('../../package.json').version;
    // sync AndroidManifest.xml
    const androidManifestPath = await config_plugins_1.AndroidConfig.Paths.getAndroidManifestAsync(options.projectRoot);
    if (!androidManifestPath) {
        throw new Error(`Could not find AndroidManifest.xml in project directory: "${options.projectRoot}"`);
    }
    const androidManifest = await config_plugins_1.AndroidConfig.Manifest.readAndroidManifestAsync(androidManifestPath);
    const updatedAndroidManifest = await config_plugins_1.AndroidConfig.Updates.setUpdatesConfigAsync(options.projectRoot, exp, androidManifest, packageVersion);
    await config_plugins_1.AndroidConfig.Manifest.writeAndroidManifestAsync(androidManifestPath, updatedAndroidManifest);
    // sync strings.xml
    const stringsJSONPath = await config_plugins_1.AndroidConfig.Strings.getProjectStringsXMLPathAsync(options.projectRoot);
    const stringsResourceXML = await config_plugins_1.AndroidConfig.Resources.readResourcesXMLAsync({
        path: stringsJSONPath,
    });
    const updatedStringsResourceXML = await config_plugins_1.AndroidConfig.Updates.applyRuntimeVersionFromConfigForProjectRootAsync(options.projectRoot, exp, stringsResourceXML);
    await config_plugins_1.XML.writeXMLAsync({ path: stringsJSONPath, xml: updatedStringsResourceXML });
}
async function syncConfigurationToNativeIosAsync(options) {
    const { exp } = (0, config_1.getConfig)(options.projectRoot, {
        isPublicConfig: false,
        skipSDKVersionRequirement: true,
    });
    const packageVersion = require('../../package.json').version;
    const expoPlist = await readExpoPlistAsync(options.projectRoot, options.platform);
    const updatedExpoPlist = await config_plugins_1.IOSConfig.Updates.setUpdatesConfigAsync(options.projectRoot, exp, expoPlist, packageVersion);
    await writeExpoPlistAsync(options.projectRoot, options.platform, updatedExpoPlist);
}
async function readExpoPlistAsync(projectDir, platform) {
    const expoPlistPath = config_plugins_1.IOSConfig.Paths.getExpoPlistPath(projectDir, platform);
    return ((await readPlistAsync(expoPlistPath)) ?? {});
}
async function writeExpoPlistAsync(projectDir, platform, expoPlist) {
    const expoPlistPath = config_plugins_1.IOSConfig.Paths.getExpoPlistPath(projectDir, platform);
    await writePlistAsync(expoPlistPath, expoPlist);
}
async function readPlistAsync(plistPath) {
    if (fs_1.default.existsSync(plistPath)) {
        const expoPlistContent = await fs_1.default.promises.readFile(plistPath, 'utf8');
        try {
            return plist_1.default.parse(expoPlistContent);
        }
        catch (err) {
            err.message = `Failed to parse ${plistPath}. ${err.message}`;
            throw err;
        }
    }
    else {
        return null;
    }
}
async function writePlistAsync(plistPath, plistObject) {
    const contents = plist_1.default.build(plistObject);
    await fs_1.default.promises.mkdir(path_1.default.dirname(plistPath), { recursive: true });
    await fs_1.default.promises.writeFile(plistPath, contents, 'utf8');
}
