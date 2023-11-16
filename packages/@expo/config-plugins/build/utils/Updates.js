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
exports.getUpdatesRequestHeadersStringified = exports.getUpdatesRequestHeaders = exports.getUpdatesCodeSigningMetadataStringified = exports.getUpdatesCodeSigningMetadata = exports.getUpdatesCodeSigningCertificate = exports.getUpdatesCheckOnLaunch = exports.getUpdatesTimeout = exports.getUpdatesEnabled = exports.getSDKVersion = exports.getRuntimeVersionAsync = exports.getRuntimeVersionNullableAsync = exports.getNativeVersion = exports.getAppVersion = exports.getUpdateUrl = exports.getExpoUpdatesPackageVersion = void 0;
const Fingerprint = __importStar(require("@expo/fingerprint"));
const sdk_runtime_versions_1 = require("@expo/sdk-runtime-versions");
const fs_1 = __importDefault(require("fs"));
const getenv_1 = require("getenv");
const path_1 = __importDefault(require("path"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const semver_1 = __importDefault(require("semver"));
const __1 = require("..");
function getExpoUpdatesPackageVersion(projectRoot) {
    const expoUpdatesPackageJsonPath = resolve_from_1.default.silent(projectRoot, 'expo-updates/package.json');
    if (!expoUpdatesPackageJsonPath || !fs_1.default.existsSync(expoUpdatesPackageJsonPath)) {
        return null;
    }
    const packageJson = JSON.parse(fs_1.default.readFileSync(expoUpdatesPackageJsonPath, 'utf8'));
    return packageJson.version;
}
exports.getExpoUpdatesPackageVersion = getExpoUpdatesPackageVersion;
function getUpdateUrl(config) {
    return config.updates?.url ?? null;
}
exports.getUpdateUrl = getUpdateUrl;
function getAppVersion(config) {
    return config.version ?? '1.0.0';
}
exports.getAppVersion = getAppVersion;
function getNativeVersion(config, platform) {
    const version = __1.IOSConfig.Version.getVersion(config);
    switch (platform) {
        case 'ios': {
            const buildNumber = __1.IOSConfig.Version.getBuildNumber(config);
            return `${version}(${buildNumber})`;
        }
        case 'android': {
            const versionCode = __1.AndroidConfig.Version.getVersionCode(config);
            return `${version}(${versionCode})`;
        }
        default: {
            throw new Error(`"${platform}" is not a supported platform. Choose either "ios" or "android".`);
        }
    }
}
exports.getNativeVersion = getNativeVersion;
async function getRuntimeVersionNullableAsync(...[projectRoot, config, platform]) {
    try {
        return await getRuntimeVersionAsync(projectRoot, config, platform);
    }
    catch (e) {
        if ((0, getenv_1.boolish)('EXPO_DEBUG', false)) {
            console.log(e);
        }
        return null;
    }
}
exports.getRuntimeVersionNullableAsync = getRuntimeVersionNullableAsync;
async function getRuntimeVersionAsync(projectRoot, config, platform) {
    const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
    if (!runtimeVersion) {
        return null;
    }
    if (typeof runtimeVersion === 'string') {
        return runtimeVersion;
    }
    else if (runtimeVersion.policy === 'appVersion') {
        return getAppVersion(config);
    }
    else if (runtimeVersion.policy === 'nativeVersion') {
        return getNativeVersion(config, platform);
    }
    else if (runtimeVersion.policy === 'sdkVersion') {
        if (!config.sdkVersion) {
            throw new Error("An SDK version must be defined when using the 'sdkVersion' runtime policy.");
        }
        return (0, sdk_runtime_versions_1.getRuntimeVersionForSDKVersion)(config.sdkVersion);
    }
    else if (runtimeVersion.policy === 'fingerprintExperimental') {
        console.warn("Use of the experimental 'fingerprintExperimental' runtime policy may result in unexpected system behavior.");
        return await Fingerprint.createProjectHashAsync(projectRoot);
    }
    throw new Error(`"${typeof runtimeVersion === 'object' ? JSON.stringify(runtimeVersion) : runtimeVersion}" is not a valid runtime version. getRuntimeVersionAsync only supports a string, "sdkVersion", "appVersion", "nativeVersion" or "fingerprintExperimental" policy.`);
}
exports.getRuntimeVersionAsync = getRuntimeVersionAsync;
function getSDKVersion(config) {
    return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}
exports.getSDKVersion = getSDKVersion;
function getUpdatesEnabled(config) {
    // allow override of enabled property
    if (config.updates?.enabled !== undefined) {
        return config.updates.enabled;
    }
    return getUpdateUrl(config) !== null;
}
exports.getUpdatesEnabled = getUpdatesEnabled;
function getUpdatesTimeout(config) {
    return config.updates?.fallbackToCacheTimeout ?? 0;
}
exports.getUpdatesTimeout = getUpdatesTimeout;
function getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion) {
    if (config.updates?.checkAutomatically === 'ON_ERROR_RECOVERY') {
        // native 'ERROR_RECOVERY_ONLY' option was only introduced in 0.11.x
        if (expoUpdatesPackageVersion && semver_1.default.gte(expoUpdatesPackageVersion, '0.11.0')) {
            return 'ERROR_RECOVERY_ONLY';
        }
        return 'NEVER';
    }
    else if (config.updates?.checkAutomatically === 'ON_LOAD') {
        return 'ALWAYS';
    }
    else if (config.updates?.checkAutomatically === 'WIFI_ONLY') {
        return 'WIFI_ONLY';
    }
    else if (config.updates?.checkAutomatically === 'NEVER') {
        return 'NEVER';
    }
    return 'ALWAYS';
}
exports.getUpdatesCheckOnLaunch = getUpdatesCheckOnLaunch;
function getUpdatesCodeSigningCertificate(projectRoot, config) {
    const codeSigningCertificatePath = config.updates?.codeSigningCertificate;
    if (!codeSigningCertificatePath) {
        return undefined;
    }
    const finalPath = path_1.default.join(projectRoot, codeSigningCertificatePath);
    if (!fs_1.default.existsSync(finalPath)) {
        throw new Error(`File not found at \`updates.codeSigningCertificate\` path: ${finalPath}`);
    }
    return fs_1.default.readFileSync(finalPath, 'utf8');
}
exports.getUpdatesCodeSigningCertificate = getUpdatesCodeSigningCertificate;
function getUpdatesCodeSigningMetadata(config) {
    return config.updates?.codeSigningMetadata;
}
exports.getUpdatesCodeSigningMetadata = getUpdatesCodeSigningMetadata;
function getUpdatesCodeSigningMetadataStringified(config) {
    const metadata = getUpdatesCodeSigningMetadata(config);
    if (!metadata) {
        return undefined;
    }
    return JSON.stringify(metadata);
}
exports.getUpdatesCodeSigningMetadataStringified = getUpdatesCodeSigningMetadataStringified;
function getUpdatesRequestHeaders(config) {
    return config.updates?.requestHeaders;
}
exports.getUpdatesRequestHeaders = getUpdatesRequestHeaders;
function getUpdatesRequestHeadersStringified(config) {
    const metadata = getUpdatesRequestHeaders(config);
    if (!metadata) {
        return undefined;
    }
    return JSON.stringify(metadata);
}
exports.getUpdatesRequestHeadersStringified = getUpdatesRequestHeadersStringified;
