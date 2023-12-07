"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
function Fingerprint() {
  const data = _interopRequireWildcard(require("@expo/fingerprint"));
  Fingerprint = function () {
    return data;
  };
  return data;
}
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
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function getExpoUpdatesPackageVersion(projectRoot) {
  const expoUpdatesPackageJsonPath = _resolveFrom().default.silent(projectRoot, 'expo-updates/package.json');
  if (!expoUpdatesPackageJsonPath || !_fs().default.existsSync(expoUpdatesPackageJsonPath)) {
    return null;
  }
  const packageJson = JSON.parse(_fs().default.readFileSync(expoUpdatesPackageJsonPath, 'utf8'));
  return packageJson.version;
}
function getUpdateUrl(config) {
  var _config$updates$url, _config$updates;
  return (_config$updates$url = (_config$updates = config.updates) === null || _config$updates === void 0 ? void 0 : _config$updates.url) !== null && _config$updates$url !== void 0 ? _config$updates$url : null;
}
function getAppVersion(config) {
  var _config$version;
  return (_config$version = config.version) !== null && _config$version !== void 0 ? _config$version : '1.0.0';
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
  var _config$platform$runt, _config$platform;
  const runtimeVersion = (_config$platform$runt = (_config$platform = config[platform]) === null || _config$platform === void 0 ? void 0 : _config$platform.runtimeVersion) !== null && _config$platform$runt !== void 0 ? _config$platform$runt : config.runtimeVersion;
  if (!runtimeVersion) {
    return null;
  }
  if (typeof runtimeVersion === 'string') {
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
    console.warn("Use of the experimental 'fingerprintExperimental' runtime policy may result in unexpected system behavior.");
    return await Fingerprint().createProjectHashAsync(projectRoot);
  }
  throw new Error(`"${typeof runtimeVersion === 'object' ? JSON.stringify(runtimeVersion) : runtimeVersion}" is not a valid runtime version. getRuntimeVersionAsync only supports a string, "sdkVersion", "appVersion", "nativeVersion" or "fingerprintExperimental" policy.`);
}
function getSDKVersion(config) {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}
function getUpdatesEnabled(config) {
  var _config$updates2;
  // allow override of enabled property
  if (((_config$updates2 = config.updates) === null || _config$updates2 === void 0 ? void 0 : _config$updates2.enabled) !== undefined) {
    return config.updates.enabled;
  }
  return getUpdateUrl(config) !== null;
}
function getUpdatesTimeout(config) {
  var _config$updates$fallb, _config$updates3;
  return (_config$updates$fallb = (_config$updates3 = config.updates) === null || _config$updates3 === void 0 ? void 0 : _config$updates3.fallbackToCacheTimeout) !== null && _config$updates$fallb !== void 0 ? _config$updates$fallb : 0;
}
function getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion) {
  var _config$updates4, _config$updates5, _config$updates6, _config$updates7;
  if (((_config$updates4 = config.updates) === null || _config$updates4 === void 0 ? void 0 : _config$updates4.checkAutomatically) === 'ON_ERROR_RECOVERY') {
    // native 'ERROR_RECOVERY_ONLY' option was only introduced in 0.11.x
    if (expoUpdatesPackageVersion && _semver().default.gte(expoUpdatesPackageVersion, '0.11.0')) {
      return 'ERROR_RECOVERY_ONLY';
    }
    return 'NEVER';
  } else if (((_config$updates5 = config.updates) === null || _config$updates5 === void 0 ? void 0 : _config$updates5.checkAutomatically) === 'ON_LOAD') {
    return 'ALWAYS';
  } else if (((_config$updates6 = config.updates) === null || _config$updates6 === void 0 ? void 0 : _config$updates6.checkAutomatically) === 'WIFI_ONLY') {
    return 'WIFI_ONLY';
  } else if (((_config$updates7 = config.updates) === null || _config$updates7 === void 0 ? void 0 : _config$updates7.checkAutomatically) === 'NEVER') {
    return 'NEVER';
  }
  return 'ALWAYS';
}
function getUpdatesCodeSigningCertificate(projectRoot, config) {
  var _config$updates8;
  const codeSigningCertificatePath = (_config$updates8 = config.updates) === null || _config$updates8 === void 0 ? void 0 : _config$updates8.codeSigningCertificate;
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
  var _config$updates9;
  return (_config$updates9 = config.updates) === null || _config$updates9 === void 0 ? void 0 : _config$updates9.codeSigningMetadata;
}
function getUpdatesCodeSigningMetadataStringified(config) {
  const metadata = getUpdatesCodeSigningMetadata(config);
  if (!metadata) {
    return undefined;
  }
  return JSON.stringify(metadata);
}
function getUpdatesRequestHeaders(config) {
  var _config$updates10;
  return (_config$updates10 = config.updates) === null || _config$updates10 === void 0 ? void 0 : _config$updates10.requestHeaders;
}
function getUpdatesRequestHeadersStringified(config) {
  const metadata = getUpdatesRequestHeaders(config);
  if (!metadata) {
    return undefined;
  }
  return JSON.stringify(metadata);
}
//# sourceMappingURL=Updates.js.map