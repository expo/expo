"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.areVersionsSyncedAsync = exports.isMainApplicationMetaDataSyncedAsync = exports.isMainApplicationMetaDataSet = exports.isBuildGradleConfigured = exports.formatApplyLineForBuildGradle = exports.ensureBuildGradleContainsConfigurationScript = exports.setVersionsConfigAsync = exports.setUpdatesConfigAsync = exports.applyRuntimeVersionFromConfigAsync = exports.withUpdates = exports.Config = void 0;
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const Manifest_1 = require("./Manifest");
const Resources_1 = require("./Resources");
const Strings_1 = require("./Strings");
const android_plugins_1 = require("../plugins/android-plugins");
const withPlugins_1 = require("../plugins/withPlugins");
const Updates_1 = require("../utils/Updates");
const CREATE_MANIFEST_ANDROID_PATH = 'expo-updates/scripts/create-manifest-android.gradle';
var Config;
(function (Config) {
    Config["ENABLED"] = "expo.modules.updates.ENABLED";
    Config["CHECK_ON_LAUNCH"] = "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH";
    Config["LAUNCH_WAIT_MS"] = "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS";
    Config["SDK_VERSION"] = "expo.modules.updates.EXPO_SDK_VERSION";
    Config["RUNTIME_VERSION"] = "expo.modules.updates.EXPO_RUNTIME_VERSION";
    Config["UPDATE_URL"] = "expo.modules.updates.EXPO_UPDATE_URL";
    Config["RELEASE_CHANNEL"] = "expo.modules.updates.EXPO_RELEASE_CHANNEL";
    Config["UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY"] = "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY";
    Config["CODE_SIGNING_CERTIFICATE"] = "expo.modules.updates.CODE_SIGNING_CERTIFICATE";
    Config["CODE_SIGNING_METADATA"] = "expo.modules.updates.CODE_SIGNING_METADATA";
})(Config || (exports.Config = Config = {}));
// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/
const withUpdates = (config) => {
    return (0, withPlugins_1.withPlugins)(config, [withUpdatesManifest, withRuntimeVersionResource]);
};
exports.withUpdates = withUpdates;
const withUpdatesManifest = (config) => {
    return (0, android_plugins_1.withAndroidManifest)(config, async (config) => {
        const projectRoot = config.modRequest.projectRoot;
        const expoUpdatesPackageVersion = (0, Updates_1.getExpoUpdatesPackageVersion)(projectRoot);
        config.modResults = await setUpdatesConfigAsync(projectRoot, config, config.modResults, expoUpdatesPackageVersion);
        return config;
    });
};
const withRuntimeVersionResource = (0, android_plugins_1.createStringsXmlPlugin)(applyRuntimeVersionFromConfigAsync, 'withRuntimeVersionResource');
async function applyRuntimeVersionFromConfigAsync(config, stringsJSON) {
    const projectRoot = config.modRequest.projectRoot;
    const runtimeVersion = await (0, Updates_1.getRuntimeVersionNullableAsync)(projectRoot, config, 'android');
    if (runtimeVersion) {
        return (0, Strings_1.setStringItem)([(0, Resources_1.buildResourceItem)({ name: 'expo_runtime_version', value: runtimeVersion })], stringsJSON);
    }
    return (0, Strings_1.removeStringItem)('expo_runtime_version', stringsJSON);
}
exports.applyRuntimeVersionFromConfigAsync = applyRuntimeVersionFromConfigAsync;
async function setUpdatesConfigAsync(projectRoot, config, androidManifest, expoUpdatesPackageVersion) {
    const mainApplication = (0, Manifest_1.getMainApplicationOrThrow)(androidManifest);
    (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.ENABLED, String((0, Updates_1.getUpdatesEnabled)(config)));
    (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.CHECK_ON_LAUNCH, (0, Updates_1.getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion));
    (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.LAUNCH_WAIT_MS, String((0, Updates_1.getUpdatesTimeout)(config)));
    const updateUrl = (0, Updates_1.getUpdateUrl)(config);
    if (updateUrl) {
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.UPDATE_URL, updateUrl);
    }
    else {
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.UPDATE_URL);
    }
    const codeSigningCertificate = (0, Updates_1.getUpdatesCodeSigningCertificate)(projectRoot, config);
    if (codeSigningCertificate) {
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.CODE_SIGNING_CERTIFICATE, codeSigningCertificate);
    }
    else {
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.CODE_SIGNING_CERTIFICATE);
    }
    const codeSigningMetadata = (0, Updates_1.getUpdatesCodeSigningMetadataStringified)(config);
    if (codeSigningMetadata) {
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.CODE_SIGNING_METADATA, codeSigningMetadata);
    }
    else {
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.CODE_SIGNING_METADATA);
    }
    const requestHeaders = (0, Updates_1.getUpdatesRequestHeadersStringified)(config);
    if (requestHeaders) {
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, requestHeaders);
    }
    else {
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY);
    }
    return await setVersionsConfigAsync(projectRoot, config, androidManifest);
}
exports.setUpdatesConfigAsync = setUpdatesConfigAsync;
async function setVersionsConfigAsync(projectRoot, config, androidManifest) {
    const mainApplication = (0, Manifest_1.getMainApplicationOrThrow)(androidManifest);
    const runtimeVersion = await (0, Updates_1.getRuntimeVersionNullableAsync)(projectRoot, config, 'android');
    if (!runtimeVersion && (0, Manifest_1.findMetaDataItem)(mainApplication, Config.RUNTIME_VERSION) > -1) {
        throw new Error('A runtime version is set in your AndroidManifest.xml, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove expo.modules.updates.EXPO_RUNTIME_VERSION from your AndroidManifest.xml.');
    }
    const sdkVersion = (0, Updates_1.getSDKVersion)(config);
    if (runtimeVersion) {
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.SDK_VERSION);
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.RUNTIME_VERSION, '@string/expo_runtime_version');
    }
    else if (sdkVersion) {
        /**
         * runtime version maybe null in projects using classic updates. In that
         * case we use SDK version
         */
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.RUNTIME_VERSION);
        (0, Manifest_1.addMetaDataItemToMainApplication)(mainApplication, Config.SDK_VERSION, sdkVersion);
    }
    else {
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.RUNTIME_VERSION);
        (0, Manifest_1.removeMetaDataItemFromMainApplication)(mainApplication, Config.SDK_VERSION);
    }
    return androidManifest;
}
exports.setVersionsConfigAsync = setVersionsConfigAsync;
function ensureBuildGradleContainsConfigurationScript(projectRoot, buildGradleContents) {
    if (!isBuildGradleConfigured(projectRoot, buildGradleContents)) {
        let cleanedUpBuildGradleContents;
        const isBuildGradleMisconfigured = buildGradleContents
            .split('\n')
            .some((line) => line.includes(CREATE_MANIFEST_ANDROID_PATH));
        if (isBuildGradleMisconfigured) {
            cleanedUpBuildGradleContents = buildGradleContents.replace(new RegExp(`(\n// Integration with Expo updates)?\n.*${CREATE_MANIFEST_ANDROID_PATH}.*\n`), '');
        }
        else {
            cleanedUpBuildGradleContents = buildGradleContents;
        }
        const gradleScriptApply = formatApplyLineForBuildGradle(projectRoot);
        return `${cleanedUpBuildGradleContents}\n// Integration with Expo updates\n${gradleScriptApply}\n`;
    }
    else {
        return buildGradleContents;
    }
}
exports.ensureBuildGradleContainsConfigurationScript = ensureBuildGradleContainsConfigurationScript;
function formatApplyLineForBuildGradle(projectRoot) {
    const updatesGradleScriptPath = resolve_from_1.default.silent(projectRoot, CREATE_MANIFEST_ANDROID_PATH);
    if (!updatesGradleScriptPath) {
        throw new Error("Could not find the build script for Android. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
    }
    const relativePath = path_1.default.relative(path_1.default.join(projectRoot, 'android', 'app'), updatesGradleScriptPath);
    const posixPath = process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;
    return `apply from: "${posixPath}"`;
}
exports.formatApplyLineForBuildGradle = formatApplyLineForBuildGradle;
function isBuildGradleConfigured(projectRoot, buildGradleContents) {
    const androidBuildScript = formatApplyLineForBuildGradle(projectRoot);
    return (buildGradleContents
        .replace(/\r\n/g, '\n')
        .split('\n')
        // Check for both single and double quotes
        .some((line) => line === androidBuildScript || line === androidBuildScript.replace(/"/g, "'")));
}
exports.isBuildGradleConfigured = isBuildGradleConfigured;
function isMainApplicationMetaDataSet(androidManifest) {
    const updateUrl = (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.UPDATE_URL);
    const runtimeVersion = (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.RUNTIME_VERSION);
    const sdkVersion = (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.SDK_VERSION);
    return Boolean(updateUrl && (sdkVersion || runtimeVersion));
}
exports.isMainApplicationMetaDataSet = isMainApplicationMetaDataSet;
async function isMainApplicationMetaDataSyncedAsync(projectRoot, config, androidManifest) {
    return ((0, Updates_1.getUpdateUrl)(config) === (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.UPDATE_URL) &&
        String((0, Updates_1.getUpdatesEnabled)(config)) ===
            (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.ENABLED) &&
        String((0, Updates_1.getUpdatesTimeout)(config)) ===
            (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.LAUNCH_WAIT_MS) &&
        (0, Updates_1.getUpdatesCheckOnLaunch)(config) ===
            (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.CHECK_ON_LAUNCH) &&
        (0, Updates_1.getUpdatesCodeSigningCertificate)(projectRoot, config) ===
            (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.CODE_SIGNING_CERTIFICATE) &&
        (0, Updates_1.getUpdatesCodeSigningMetadataStringified)(config) ===
            (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.CODE_SIGNING_METADATA) &&
        (await areVersionsSyncedAsync(projectRoot, config, androidManifest)));
}
exports.isMainApplicationMetaDataSyncedAsync = isMainApplicationMetaDataSyncedAsync;
async function areVersionsSyncedAsync(projectRoot, config, androidManifest) {
    const expectedRuntimeVersion = await (0, Updates_1.getRuntimeVersionNullableAsync)(projectRoot, config, 'android');
    const expectedSdkVersion = (0, Updates_1.getSDKVersion)(config);
    const currentRuntimeVersion = (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.RUNTIME_VERSION);
    const currentSdkVersion = (0, Manifest_1.getMainApplicationMetaDataValue)(androidManifest, Config.SDK_VERSION);
    if (expectedRuntimeVersion !== null) {
        return currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === null;
    }
    else if (expectedSdkVersion !== null) {
        return currentSdkVersion === expectedSdkVersion && currentRuntimeVersion === null;
    }
    else {
        return true;
    }
}
exports.areVersionsSyncedAsync = areVersionsSyncedAsync;
