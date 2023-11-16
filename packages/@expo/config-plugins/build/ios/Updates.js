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
exports.isPlistVersionConfigurationSyncedAsync = exports.isPlistConfigurationSyncedAsync = exports.isPlistConfigurationSet = exports.isShellScriptBuildPhaseConfigured = exports.ensureBundleReactNativePhaseContainsConfigurationScript = exports.getBundleReactNativePhase = exports.setVersionsConfigAsync = exports.setUpdatesConfigAsync = exports.withUpdates = exports.Config = void 0;
const path = __importStar(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const ios_plugins_1 = require("../plugins/ios-plugins");
const Updates_1 = require("../utils/Updates");
const CREATE_MANIFEST_IOS_PATH = 'expo-updates/scripts/create-manifest-ios.sh';
var Config;
(function (Config) {
    Config["ENABLED"] = "EXUpdatesEnabled";
    Config["CHECK_ON_LAUNCH"] = "EXUpdatesCheckOnLaunch";
    Config["LAUNCH_WAIT_MS"] = "EXUpdatesLaunchWaitMs";
    Config["RUNTIME_VERSION"] = "EXUpdatesRuntimeVersion";
    Config["SDK_VERSION"] = "EXUpdatesSDKVersion";
    Config["UPDATE_URL"] = "EXUpdatesURL";
    Config["RELEASE_CHANNEL"] = "EXUpdatesReleaseChannel";
    Config["UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY"] = "EXUpdatesRequestHeaders";
    Config["CODE_SIGNING_CERTIFICATE"] = "EXUpdatesCodeSigningCertificate";
    Config["CODE_SIGNING_METADATA"] = "EXUpdatesCodeSigningMetadata";
})(Config || (exports.Config = Config = {}));
// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/
const withUpdates = (config) => {
    return (0, ios_plugins_1.withExpoPlist)(config, async (config) => {
        const projectRoot = config.modRequest.projectRoot;
        const expoUpdatesPackageVersion = (0, Updates_1.getExpoUpdatesPackageVersion)(projectRoot);
        config.modResults = await setUpdatesConfigAsync(projectRoot, config, config.modResults, expoUpdatesPackageVersion);
        return config;
    });
};
exports.withUpdates = withUpdates;
async function setUpdatesConfigAsync(projectRoot, config, expoPlist, expoUpdatesPackageVersion) {
    const newExpoPlist = {
        ...expoPlist,
        [Config.ENABLED]: (0, Updates_1.getUpdatesEnabled)(config),
        [Config.CHECK_ON_LAUNCH]: (0, Updates_1.getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion),
        [Config.LAUNCH_WAIT_MS]: (0, Updates_1.getUpdatesTimeout)(config),
    };
    const updateUrl = (0, Updates_1.getUpdateUrl)(config);
    if (updateUrl) {
        newExpoPlist[Config.UPDATE_URL] = updateUrl;
    }
    else {
        delete newExpoPlist[Config.UPDATE_URL];
    }
    const codeSigningCertificate = (0, Updates_1.getUpdatesCodeSigningCertificate)(projectRoot, config);
    if (codeSigningCertificate) {
        newExpoPlist[Config.CODE_SIGNING_CERTIFICATE] = codeSigningCertificate;
    }
    else {
        delete newExpoPlist[Config.CODE_SIGNING_CERTIFICATE];
    }
    const codeSigningMetadata = (0, Updates_1.getUpdatesCodeSigningMetadata)(config);
    if (codeSigningMetadata) {
        newExpoPlist[Config.CODE_SIGNING_METADATA] = codeSigningMetadata;
    }
    else {
        delete newExpoPlist[Config.CODE_SIGNING_METADATA];
    }
    const requestHeaders = (0, Updates_1.getUpdatesRequestHeaders)(config);
    if (requestHeaders) {
        newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY] = requestHeaders;
    }
    else {
        delete newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY];
    }
    return await setVersionsConfigAsync(projectRoot, config, newExpoPlist);
}
exports.setUpdatesConfigAsync = setUpdatesConfigAsync;
async function setVersionsConfigAsync(projectRoot, config, expoPlist) {
    const newExpoPlist = { ...expoPlist };
    const runtimeVersion = await (0, Updates_1.getRuntimeVersionNullableAsync)(projectRoot, config, 'ios');
    if (!runtimeVersion && expoPlist[Config.RUNTIME_VERSION]) {
        throw new Error('A runtime version is set in your Expo.plist, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove EXUpdatesRuntimeVersion from your Expo.plist.');
    }
    const sdkVersion = (0, Updates_1.getSDKVersion)(config);
    if (runtimeVersion) {
        delete newExpoPlist[Config.SDK_VERSION];
        newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
    }
    else if (sdkVersion) {
        /**
         * runtime version maybe null in projects using classic updates. In that
         * case we use SDK version
         */
        delete newExpoPlist[Config.RUNTIME_VERSION];
        newExpoPlist[Config.SDK_VERSION] = sdkVersion;
    }
    else {
        delete newExpoPlist[Config.SDK_VERSION];
        delete newExpoPlist[Config.RUNTIME_VERSION];
    }
    return newExpoPlist;
}
exports.setVersionsConfigAsync = setVersionsConfigAsync;
function formatConfigurationScriptPath(projectRoot) {
    const buildScriptPath = resolve_from_1.default.silent(projectRoot, CREATE_MANIFEST_IOS_PATH);
    if (!buildScriptPath) {
        throw new Error("Could not find the build script for iOS. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
    }
    const relativePath = path.relative(path.join(projectRoot, 'ios'), buildScriptPath);
    return process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;
}
function getBundleReactNativePhase(project) {
    const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase;
    const bundleReactNative = Object.values(shellScriptBuildPhase).find((buildPhase) => buildPhase.name === '"Bundle React Native code and images"');
    if (!bundleReactNative) {
        throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
    }
    return bundleReactNative;
}
exports.getBundleReactNativePhase = getBundleReactNativePhase;
function ensureBundleReactNativePhaseContainsConfigurationScript(projectRoot, project) {
    const bundleReactNative = getBundleReactNativePhase(project);
    const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
    if (!isShellScriptBuildPhaseConfigured(projectRoot, project)) {
        // check if there's already another path to create-manifest-ios.sh
        // this might be the case for monorepos
        if (bundleReactNative.shellScript.includes(CREATE_MANIFEST_IOS_PATH)) {
            bundleReactNative.shellScript = bundleReactNative.shellScript.replace(new RegExp(`(\\\\n)(\\.\\.)+/node_modules/${CREATE_MANIFEST_IOS_PATH}`), '');
        }
        bundleReactNative.shellScript = `${bundleReactNative.shellScript.replace(/"$/, '')}${buildPhaseShellScriptPath}\\n"`;
    }
    return project;
}
exports.ensureBundleReactNativePhaseContainsConfigurationScript = ensureBundleReactNativePhaseContainsConfigurationScript;
function isShellScriptBuildPhaseConfigured(projectRoot, project) {
    const bundleReactNative = getBundleReactNativePhase(project);
    const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
    return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}
exports.isShellScriptBuildPhaseConfigured = isShellScriptBuildPhaseConfigured;
function isPlistConfigurationSet(expoPlist) {
    return Boolean(expoPlist.EXUpdatesURL && (expoPlist.EXUpdatesSDKVersion || expoPlist.EXUpdatesRuntimeVersion));
}
exports.isPlistConfigurationSet = isPlistConfigurationSet;
async function isPlistConfigurationSyncedAsync(projectRoot, config, expoPlist) {
    return ((0, Updates_1.getUpdateUrl)(config) === expoPlist.EXUpdatesURL &&
        (0, Updates_1.getUpdatesEnabled)(config) === expoPlist.EXUpdatesEnabled &&
        (0, Updates_1.getUpdatesTimeout)(config) === expoPlist.EXUpdatesLaunchWaitMs &&
        (0, Updates_1.getUpdatesCheckOnLaunch)(config) === expoPlist.EXUpdatesCheckOnLaunch &&
        (0, Updates_1.getUpdatesCodeSigningCertificate)(projectRoot, config) ===
            expoPlist.EXUpdatesCodeSigningCertificate &&
        (0, Updates_1.getUpdatesCodeSigningMetadata)(config) === expoPlist.EXUpdatesCodeSigningMetadata &&
        (await isPlistVersionConfigurationSyncedAsync(projectRoot, config, expoPlist)));
}
exports.isPlistConfigurationSyncedAsync = isPlistConfigurationSyncedAsync;
async function isPlistVersionConfigurationSyncedAsync(projectRoot, config, expoPlist) {
    const expectedRuntimeVersion = await (0, Updates_1.getRuntimeVersionNullableAsync)(projectRoot, config, 'ios');
    const expectedSdkVersion = (0, Updates_1.getSDKVersion)(config);
    const currentRuntimeVersion = expoPlist.EXUpdatesRuntimeVersion ?? null;
    const currentSdkVersion = expoPlist.EXUpdatesSDKVersion ?? null;
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
exports.isPlistVersionConfigurationSyncedAsync = isPlistVersionConfigurationSyncedAsync;
