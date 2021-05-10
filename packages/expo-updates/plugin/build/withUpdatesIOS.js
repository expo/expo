"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.isPlistVersionConfigurationSynced = exports.isPlistConfigurationSynced = exports.isPlistConfigurationSet = exports.isShellScriptBuildPhaseConfigured = exports.ensureBundleReactNativePhaseContainsConfigurationScript = exports.getBundleReactNativePhase = exports.setVersionsConfig = exports.setUpdatesConfig = exports.withUpdatesIOS = exports.getUpdatesCheckOnLaunch = exports.getUpdatesTimeout = exports.getUpdatesEnabled = exports.getSDKVersion = exports.getRuntimeVersion = exports.getUpdateUrl = exports.Config = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const path = __importStar(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const CREATE_MANIFEST_IOS_PATH = 'expo-updates/scripts/create-manifest-ios.sh';
var Config;
(function (Config) {
    Config["ENABLED"] = "EXUpdatesEnabled";
    Config["CHECK_ON_LAUNCH"] = "EXUpdatesCheckOnLaunch";
    Config["LAUNCH_WAIT_MS"] = "EXUpdatesLaunchWaitMs";
    Config["RUNTIME_VERSION"] = "EXUpdatesRuntimeVersion";
    Config["SDK_VERSION"] = "EXUpdatesSDKVersion";
    Config["UPDATE_URL"] = "EXUpdatesURL";
})(Config = exports.Config || (exports.Config = {}));
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
exports.withUpdatesIOS = (config, { expoUsername }) => {
    return config_plugins_1.withExpoPlist(config, config => {
        config.modResults = setUpdatesConfig(config, config.modResults, expoUsername);
        return config;
    });
};
function setUpdatesConfig(config, expoPlist, username) {
    const newExpoPlist = {
        ...expoPlist,
        [Config.ENABLED]: getUpdatesEnabled(config),
        [Config.CHECK_ON_LAUNCH]: getUpdatesCheckOnLaunch(config),
        [Config.LAUNCH_WAIT_MS]: getUpdatesTimeout(config),
    };
    const updateUrl = getUpdateUrl(config, username);
    if (updateUrl) {
        newExpoPlist[Config.UPDATE_URL] = updateUrl;
    }
    else {
        delete newExpoPlist[Config.UPDATE_URL];
    }
    return setVersionsConfig(config, newExpoPlist);
}
exports.setUpdatesConfig = setUpdatesConfig;
function setVersionsConfig(config, expoPlist) {
    const newExpoPlist = { ...expoPlist };
    const runtimeVersion = getRuntimeVersion(config);
    const sdkVersion = getSDKVersion(config);
    if (runtimeVersion) {
        delete newExpoPlist[Config.SDK_VERSION];
        newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
    }
    else if (sdkVersion) {
        delete newExpoPlist[Config.RUNTIME_VERSION];
        newExpoPlist[Config.SDK_VERSION] = sdkVersion;
    }
    else {
        delete newExpoPlist[Config.SDK_VERSION];
        delete newExpoPlist[Config.RUNTIME_VERSION];
    }
    return newExpoPlist;
}
exports.setVersionsConfig = setVersionsConfig;
function formatConfigurationScriptPath(projectRoot) {
    const buildScriptPath = resolve_from_1.default.silent(projectRoot, CREATE_MANIFEST_IOS_PATH);
    if (!buildScriptPath) {
        throw new Error("Could not find the build script for iOS. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
    }
    return path.relative(path.join(projectRoot, 'ios'), buildScriptPath);
}
function getBundleReactNativePhase(project) {
    const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase;
    const bundleReactNative = Object.values(shellScriptBuildPhase).find(buildPhase => buildPhase.name === '"Bundle React Native code and images"');
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
function isPlistConfigurationSynced(config, expoPlist, username) {
    return (getUpdateUrl(config, username) === expoPlist.EXUpdatesURL &&
        getUpdatesEnabled(config) === expoPlist.EXUpdatesEnabled &&
        getUpdatesTimeout(config) === expoPlist.EXUpdatesLaunchWaitMs &&
        getUpdatesCheckOnLaunch(config) === expoPlist.EXUpdatesCheckOnLaunch &&
        isPlistVersionConfigurationSynced(config, expoPlist));
}
exports.isPlistConfigurationSynced = isPlistConfigurationSynced;
function isPlistVersionConfigurationSynced(config, expoPlist) {
    var _a, _b;
    const expectedRuntimeVersion = getRuntimeVersion(config);
    const expectedSdkVersion = getSDKVersion(config);
    const currentRuntimeVersion = (_a = expoPlist.EXUpdatesRuntimeVersion) !== null && _a !== void 0 ? _a : null;
    const currentSdkVersion = (_b = expoPlist.EXUpdatesSDKVersion) !== null && _b !== void 0 ? _b : null;
    return (currentSdkVersion === expectedSdkVersion && currentRuntimeVersion === expectedRuntimeVersion);
}
exports.isPlistVersionConfigurationSynced = isPlistVersionConfigurationSynced;
