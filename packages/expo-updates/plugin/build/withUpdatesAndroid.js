"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.areVersionsSynced = exports.isMainApplicationMetaDataSynced = exports.isMainApplicationMetaDataSet = exports.isBuildGradleConfigured = exports.formatApplyLineForBuildGradle = exports.ensureBuildGradleContainsConfigurationScript = exports.setVersionsConfig = exports.setUpdatesConfig = exports.getUpdatesCheckOnLaunch = exports.getUpdatesTimeout = exports.getUpdatesEnabled = exports.getSDKVersion = exports.getRuntimeVersion = exports.getUpdateUrl = exports.withUpdatesAndroid = exports.Config = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const { addMetaDataItemToMainApplication, getMainApplicationMetaDataValue, getMainApplicationOrThrow, removeMetaDataItemFromMainApplication, } = config_plugins_1.AndroidConfig.Manifest;
const CREATE_MANIFEST_ANDROID_PATH = 'expo-updates/scripts/create-manifest-android.gradle';
var Config;
(function (Config) {
    Config["ENABLED"] = "expo.modules.updates.ENABLED";
    Config["CHECK_ON_LAUNCH"] = "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH";
    Config["LAUNCH_WAIT_MS"] = "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS";
    Config["SDK_VERSION"] = "expo.modules.updates.EXPO_SDK_VERSION";
    Config["RUNTIME_VERSION"] = "expo.modules.updates.EXPO_RUNTIME_VERSION";
    Config["UPDATE_URL"] = "expo.modules.updates.EXPO_UPDATE_URL";
})(Config = exports.Config || (exports.Config = {}));
exports.withUpdatesAndroid = (config, { expoUsername }) => {
    return config_plugins_1.withAndroidManifest(config, config => {
        config.modResults = setUpdatesConfig(config, config.modResults, expoUsername);
        return config;
    });
};
function getUpdateUrl(config, username) {
    const user = typeof config.owner === 'string' ? config.owner : username;
    if (!user) {
        return null;
    }
    return `https://exp.host/@${user}/${config.slug}`;
}
exports.getUpdateUrl = getUpdateUrl;
function getRuntimeVersion(config) {
    return typeof config.runtimeVersion === 'string' ? config.runtimeVersion : null;
}
exports.getRuntimeVersion = getRuntimeVersion;
function getSDKVersion(config) {
    return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}
exports.getSDKVersion = getSDKVersion;
function getUpdatesEnabled(config) {
    var _a;
    return ((_a = config.updates) === null || _a === void 0 ? void 0 : _a.enabled) !== false;
}
exports.getUpdatesEnabled = getUpdatesEnabled;
function getUpdatesTimeout(config) {
    var _a, _b;
    return (_b = (_a = config.updates) === null || _a === void 0 ? void 0 : _a.fallbackToCacheTimeout) !== null && _b !== void 0 ? _b : 0;
}
exports.getUpdatesTimeout = getUpdatesTimeout;
function getUpdatesCheckOnLaunch(config) {
    var _a, _b;
    if (((_a = config.updates) === null || _a === void 0 ? void 0 : _a.checkAutomatically) === 'ON_ERROR_RECOVERY') {
        return 'NEVER';
    }
    else if (((_b = config.updates) === null || _b === void 0 ? void 0 : _b.checkAutomatically) === 'ON_LOAD') {
        return 'ALWAYS';
    }
    return 'ALWAYS';
}
exports.getUpdatesCheckOnLaunch = getUpdatesCheckOnLaunch;
function setUpdatesConfig(config, androidManifest, username) {
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    addMetaDataItemToMainApplication(mainApplication, Config.ENABLED, String(getUpdatesEnabled(config)));
    addMetaDataItemToMainApplication(mainApplication, Config.CHECK_ON_LAUNCH, getUpdatesCheckOnLaunch(config));
    addMetaDataItemToMainApplication(mainApplication, Config.LAUNCH_WAIT_MS, String(getUpdatesTimeout(config)));
    const updateUrl = getUpdateUrl(config, username);
    if (updateUrl) {
        addMetaDataItemToMainApplication(mainApplication, Config.UPDATE_URL, updateUrl);
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, Config.UPDATE_URL);
    }
    return setVersionsConfig(config, androidManifest);
}
exports.setUpdatesConfig = setUpdatesConfig;
function setVersionsConfig(config, androidManifest) {
    const mainApplication = getMainApplicationOrThrow(androidManifest);
    const runtimeVersion = getRuntimeVersion(config);
    const sdkVersion = getSDKVersion(config);
    if (runtimeVersion) {
        removeMetaDataItemFromMainApplication(mainApplication, Config.SDK_VERSION);
        addMetaDataItemToMainApplication(mainApplication, Config.RUNTIME_VERSION, runtimeVersion);
    }
    else if (sdkVersion) {
        removeMetaDataItemFromMainApplication(mainApplication, Config.RUNTIME_VERSION);
        addMetaDataItemToMainApplication(mainApplication, Config.SDK_VERSION, sdkVersion);
    }
    else {
        removeMetaDataItemFromMainApplication(mainApplication, Config.RUNTIME_VERSION);
        removeMetaDataItemFromMainApplication(mainApplication, Config.SDK_VERSION);
    }
    return androidManifest;
}
exports.setVersionsConfig = setVersionsConfig;
function ensureBuildGradleContainsConfigurationScript(projectRoot, buildGradleContents) {
    if (!isBuildGradleConfigured(projectRoot, buildGradleContents)) {
        let cleanedUpBuildGradleContents;
        const isBuildGradleMisconfigured = buildGradleContents
            .split('\n')
            .some(line => line.includes(CREATE_MANIFEST_ANDROID_PATH));
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
    return `apply from: ${JSON.stringify(path_1.default.relative(path_1.default.join(projectRoot, 'android', 'app'), updatesGradleScriptPath))}`;
}
exports.formatApplyLineForBuildGradle = formatApplyLineForBuildGradle;
function isBuildGradleConfigured(projectRoot, buildGradleContents) {
    const androidBuildScript = formatApplyLineForBuildGradle(projectRoot);
    return (buildGradleContents
        .split('\n')
        // Check for both single and double quotes
        .some(line => line === androidBuildScript || line === androidBuildScript.replace(/"/g, "'")));
}
exports.isBuildGradleConfigured = isBuildGradleConfigured;
function isMainApplicationMetaDataSet(androidManifest) {
    const updateUrl = getMainApplicationMetaDataValue(androidManifest, Config.UPDATE_URL);
    const runtimeVersion = getMainApplicationMetaDataValue(androidManifest, Config.RUNTIME_VERSION);
    const sdkVersion = getMainApplicationMetaDataValue(androidManifest, Config.SDK_VERSION);
    return Boolean(updateUrl && (sdkVersion || runtimeVersion));
}
exports.isMainApplicationMetaDataSet = isMainApplicationMetaDataSet;
function isMainApplicationMetaDataSynced(config, androidManifest, username) {
    return (getUpdateUrl(config, username) ===
        getMainApplicationMetaDataValue(androidManifest, Config.UPDATE_URL) &&
        String(getUpdatesEnabled(config)) ===
            getMainApplicationMetaDataValue(androidManifest, Config.ENABLED) &&
        String(getUpdatesTimeout(config)) ===
            getMainApplicationMetaDataValue(androidManifest, Config.LAUNCH_WAIT_MS) &&
        getUpdatesCheckOnLaunch(config) ===
            getMainApplicationMetaDataValue(androidManifest, Config.CHECK_ON_LAUNCH) &&
        areVersionsSynced(config, androidManifest));
}
exports.isMainApplicationMetaDataSynced = isMainApplicationMetaDataSynced;
function areVersionsSynced(config, androidManifest) {
    const expectedRuntimeVersion = getRuntimeVersion(config);
    const expectedSdkVersion = getSDKVersion(config);
    const currentRuntimeVersion = getMainApplicationMetaDataValue(androidManifest, Config.RUNTIME_VERSION);
    const currentSdkVersion = getMainApplicationMetaDataValue(androidManifest, Config.SDK_VERSION);
    return (currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === expectedSdkVersion);
}
exports.areVersionsSynced = areVersionsSynced;
