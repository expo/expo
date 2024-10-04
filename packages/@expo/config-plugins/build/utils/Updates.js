"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FINGERPRINT_RUNTIME_VERSION_SENTINEL = void 0;
exports.getAppVersion = getAppVersion;
exports.getExpoUpdatesPackageVersion = getExpoUpdatesPackageVersion;
exports.getNativeVersion = getNativeVersion;
exports.getRuntimeVersionAsync = getRuntimeVersionAsync;
exports.getRuntimeVersionNullableAsync = getRuntimeVersionNullableAsync;
exports.getSDKVersion = getSDKVersion;
exports.getUpdateUrl = getUpdateUrl;
exports.getUpdatesCheckOnLaunch = getUpdatesCheckOnLaunch;
exports.getUpdatesCodeSigningCertificate = getUpdatesCodeSigningCertificate;
exports.getUpdatesCodeSigningMetadata = getUpdatesCodeSigningMetadata;
exports.getUpdatesCodeSigningMetadataStringified = getUpdatesCodeSigningMetadataStringified;
exports.getUpdatesEnabled = getUpdatesEnabled;
exports.getUpdatesRequestHeaders = getUpdatesRequestHeaders;
exports.getUpdatesRequestHeadersStringified = getUpdatesRequestHeadersStringified;
exports.getUpdatesTimeout = getUpdatesTimeout;
function _sdkRuntimeVersions() {
  const data = require("@expo/sdk-runtime-versions");
  _sdkRuntimeVersions = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _getenv() {
  const data = require("getenv");
  _getenv = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _resolveFrom() {
  const data = _interopRequireDefault(require("resolve-from"));
  _resolveFrom = function () {
    return data;
  };
  return data;
}
function _semver() {
  const data = _interopRequireDefault(require("semver"));
  _semver = function () {
    return data;
  };
  return data;
}
function _() {
  const data = require("..");
  _ = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const FINGERPRINT_RUNTIME_VERSION_SENTINEL = exports.FINGERPRINT_RUNTIME_VERSION_SENTINEL = 'file:fingerprint';
function getExpoUpdatesPackageVersion(projectRoot) {
  const expoUpdatesPackageJsonPath = _resolveFrom().default.silent(projectRoot, 'expo-updates/package.json');
  if (!expoUpdatesPackageJsonPath || !_fs().default.existsSync(expoUpdatesPackageJsonPath)) {
    return null;
  }
  const packageJson = JSON.parse(_fs().default.readFileSync(expoUpdatesPackageJsonPath, 'utf8'));
  return packageJson.version;
}
function getUpdateUrl(config) {
  return config.updates?.url ?? null;
}
function getAppVersion(config) {
  return config.version ?? '1.0.0';
}
function getNativeVersion(config, platform) {
  const version = _().IOSConfig.Version.getVersion(config);
  switch (platform) {
    case 'ios':
      {
        const buildNumber = _().IOSConfig.Version.getBuildNumber(config);
        return `${version}(${buildNumber})`;
      }
    case 'android':
      {
        const versionCode = _().AndroidConfig.Version.getVersionCode(config);
        return `${version}(${versionCode})`;
      }
    default:
      {
        throw new Error(`"${platform}" is not a supported platform. Choose either "ios" or "android".`);
      }
  }
}
async function getRuntimeVersionNullableAsync(...[projectRoot, config, platform]) {
  try {
    return await getRuntimeVersionAsync(projectRoot, config, platform);
  } catch (e) {
    if ((0, _getenv().boolish)('EXPO_DEBUG', false)) {
      console.log(e);
    }
    return null;
  }
}
async function getRuntimeVersionAsync(projectRoot, config, platform) {
  const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
  if (!runtimeVersion) {
    return null;
  }
  if (typeof runtimeVersion === 'string') {
    if (runtimeVersion === FINGERPRINT_RUNTIME_VERSION_SENTINEL) {
      throw new Error(`${FINGERPRINT_RUNTIME_VERSION_SENTINEL} is a reserved value for runtime version. To use a fingerprint runtime version, use the "fingerprintExperimental" runtime version policy.`);
    }
    return runtimeVersion;
  } else if (runtimeVersion.policy === 'appVersion') {
    return getAppVersion(config);
  } else if (runtimeVersion.policy === 'nativeVersion') {
    return getNativeVersion(config, platform);
  } else if (runtimeVersion.policy === 'sdkVersion') {
    if (!config.sdkVersion) {
      throw new Error("An SDK version must be defined when using the 'sdkVersion' runtime policy.");
    }
    return (0, _sdkRuntimeVersions().getRuntimeVersionForSDKVersion)(config.sdkVersion);
  } else if (runtimeVersion.policy === 'fingerprintExperimental') {
    console.warn(`Use of the experimental '${runtimeVersion.policy}' runtime policy may result in unexpected system behavior.`);
    return FINGERPRINT_RUNTIME_VERSION_SENTINEL;
  }
  throw new Error(`"${typeof runtimeVersion === 'object' ? JSON.stringify(runtimeVersion) : runtimeVersion}" is not a valid runtime version. getRuntimeVersionAsync only supports a string or one of the following policies: sdkVersion, appVersion, nativeVersion, fingerprintExperimental.`);
}
function getSDKVersion(config) {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}
function getUpdatesEnabled(config) {
  // allow override of enabled property
  if (config.updates?.enabled !== undefined) {
    return config.updates.enabled;
  }
  return getUpdateUrl(config) !== null;
}
function getUpdatesTimeout(config) {
  return config.updates?.fallbackToCacheTimeout ?? 0;
}
function getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion) {
  if (config.updates?.checkAutomatically === 'ON_ERROR_RECOVERY') {
    // native 'ERROR_RECOVERY_ONLY' option was only introduced in 0.11.x
    if (expoUpdatesPackageVersion && _semver().default.gte(expoUpdatesPackageVersion, '0.11.0')) {
      return 'ERROR_RECOVERY_ONLY';
    }
    return 'NEVER';
  } else if (config.updates?.checkAutomatically === 'ON_LOAD') {
    return 'ALWAYS';
  } else if (config.updates?.checkAutomatically === 'WIFI_ONLY') {
    return 'WIFI_ONLY';
  } else if (config.updates?.checkAutomatically === 'NEVER') {
    return 'NEVER';
  }
  return 'ALWAYS';
}
function getUpdatesCodeSigningCertificate(projectRoot, config) {
  const codeSigningCertificatePath = config.updates?.codeSigningCertificate;
  if (!codeSigningCertificatePath) {
    return undefined;
  }
  const finalPath = _path().default.join(projectRoot, codeSigningCertificatePath);
  if (!_fs().default.existsSync(finalPath)) {
    throw new Error(`File not found at \`updates.codeSigningCertificate\` path: ${finalPath}`);
  }
  return _fs().default.readFileSync(finalPath, 'utf8');
}
function getUpdatesCodeSigningMetadata(config) {
  return config.updates?.codeSigningMetadata;
}
function getUpdatesCodeSigningMetadataStringified(config) {
  const metadata = getUpdatesCodeSigningMetadata(config);
  if (!metadata) {
    return undefined;
  }
  return JSON.stringify(metadata);
}
function getUpdatesRequestHeaders(config) {
  return config.updates?.requestHeaders;
}
function getUpdatesRequestHeadersStringified(config) {
  const metadata = getUpdatesRequestHeaders(config);
  if (!metadata) {
    return undefined;
  }
  return JSON.stringify(metadata);
}
//# sourceMappingURL=Updates.js.map