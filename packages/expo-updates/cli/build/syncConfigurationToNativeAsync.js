"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncConfigurationToNativeAsync = void 0;
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const plist_1 = __importDefault(require("@expo/plist"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Synchronize updates configuration to native files. This needs to do essentially the same thing as `withUpdates`
 */
async function syncConfigurationToNativeAsync(options) {
    if (options.workflow !== 'generic') {
        // not applicable to managed workflow
    }
    switch (options.platform) {
        case 'android':
            await syncConfigurationToNativeAndroidAsync(options);
            break;
        case 'ios':
            await syncConfigurationToNativeIosAsync(options);
            break;
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
    const expoPlist = await readExpoPlistAsync(options.projectRoot);
    const updatedExpoPlist = await config_plugins_1.IOSConfig.Updates.setUpdatesConfigAsync(options.projectRoot, exp, expoPlist, packageVersion);
    await writeExpoPlistAsync(options.projectRoot, updatedExpoPlist);
}
async function readExpoPlistAsync(projectDir) {
    const expoPlistPath = config_plugins_1.IOSConfig.Paths.getExpoPlistPath(projectDir);
    return ((await readPlistAsync(expoPlistPath)) ?? {});
}
async function writeExpoPlistAsync(projectDir, expoPlist) {
    const expoPlistPath = config_plugins_1.IOSConfig.Paths.getExpoPlistPath(projectDir);
    await writePlistAsync(expoPlistPath, expoPlist);
}
async function readPlistAsync(plistPath) {
    if (await fs_extra_1.default.pathExists(plistPath)) {
        const expoPlistContent = await fs_extra_1.default.readFile(plistPath, 'utf8');
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
    await fs_extra_1.default.mkdirp(path_1.default.dirname(plistPath));
    await fs_extra_1.default.writeFile(plistPath, contents);
}
