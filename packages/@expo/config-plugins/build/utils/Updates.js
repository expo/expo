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
exports.getUpdatesUseEmbeddedUpdate = getUpdatesUseEmbeddedUpdate;
exports.resolveRuntimeVersionPolicyAsync = resolveRuntimeVersionPolicyAsync;
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
function AndroidVersion() {
  const data = _interopRequireWildcard(require("../android/Version"));
  AndroidVersion = function () {
    return data;
  };
  return data;
}
function IOSVersion() {
  const data = _interopRequireWildcard(require("../ios/Version"));
  IOSVersion = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
  const version = IOSVersion().getVersion(config);
  switch (platform) {
    case 'ios':
      {
        const buildNumber = IOSVersion().getBuildNumber(config);
        return `${version}(${buildNumber})`;
      }
    case 'android':
      {
        const versionCode = AndroidVersion().getVersionCode(config);
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
      throw new Error(`${FINGERPRINT_RUNTIME_VERSION_SENTINEL} is a reserved value for runtime version. To use a fingerprint runtime version, use the "fingerprint" runtime version policy.`);
    }
    return runtimeVersion;
  } else if (!runtimeVersion.policy) {
    throw new Error(`"${runtimeVersion}" is not a valid runtime version. Only a string or a runtime version policy is supported.`);
  } else if (runtimeVersion.policy === 'fingerprint') {
    return FINGERPRINT_RUNTIME_VERSION_SENTINEL;
  } else {
    return await resolveRuntimeVersionPolicyAsync(runtimeVersion.policy, config, platform);
  }
}
async function resolveRuntimeVersionPolicyAsync(policy, config, platform) {
  if (policy === 'appVersion') {
    return getAppVersion(config);
  } else if (policy === 'nativeVersion') {
    return getNativeVersion(config, platform);
  } else if (policy === 'sdkVersion') {
    if (!config.sdkVersion) {
      throw new Error("An SDK version must be defined when using the 'sdkVersion' runtime policy.");
    }
    return (0, _sdkRuntimeVersions().getRuntimeVersionForSDKVersion)(config.sdkVersion);
  } else {
    // fingerprint is resolvable only at build time (not in config plugin).
    throw new Error(`"${policy}" is not a valid runtime version policy type.`);
  }
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
function getUpdatesUseEmbeddedUpdate(config) {
  if (config.updates?.useEmbeddedUpdate !== undefined) {
    return config.updates.useEmbeddedUpdate;
  }
  return true;
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