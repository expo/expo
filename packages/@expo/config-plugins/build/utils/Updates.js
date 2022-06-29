"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExpoUpdatesPackageVersion = getExpoUpdatesPackageVersion;
exports.getNativeVersion = getNativeVersion;
exports.getRuntimeVersion = getRuntimeVersion;
exports.getRuntimeVersionNullable = getRuntimeVersionNullable;
exports.getSDKVersion = getSDKVersion;
exports.getUpdateUrl = getUpdateUrl;
exports.getUpdatesCheckOnLaunch = getUpdatesCheckOnLaunch;
exports.getUpdatesCodeSigningCertificate = getUpdatesCodeSigningCertificate;
exports.getUpdatesCodeSigningMetadata = getUpdatesCodeSigningMetadata;
exports.getUpdatesCodeSigningMetadataStringified = getUpdatesCodeSigningMetadataStringified;
exports.getUpdatesEnabled = getUpdatesEnabled;
exports.getUpdatesTimeout = getUpdatesTimeout;
exports.withRuntimeVersion = void 0;

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

function getExpoUpdatesPackageVersion(projectRoot) {
  const expoUpdatesPackageJsonPath = _resolveFrom().default.silent(projectRoot, 'expo-updates/package.json');

  if (!expoUpdatesPackageJsonPath || !_fs().default.existsSync(expoUpdatesPackageJsonPath)) {
    return null;
  }

  const packageJson = JSON.parse(_fs().default.readFileSync(expoUpdatesPackageJsonPath, 'utf8'));
  return packageJson.version;
}

function getUpdateUrl(config, username) {
  var _config$updates;

  if ((_config$updates = config.updates) !== null && _config$updates !== void 0 && _config$updates.url) {
    var _config$updates2;

    return (_config$updates2 = config.updates) === null || _config$updates2 === void 0 ? void 0 : _config$updates2.url;
  }

  const user = typeof config.owner === 'string' ? config.owner : username;

  if (!user) {
    return null;
  }

  return `https://exp.host/@${user}/${config.slug}`;
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
/**
 * Compute runtime version policies.
 * @return an expoConfig with only string valued platform specific runtime versions.
 */


const withRuntimeVersion = config => {
  var _config$ios, _config$android;

  if ((_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.runtimeVersion || config.runtimeVersion) {
    const runtimeVersion = getRuntimeVersion(config, 'ios');

    if (runtimeVersion) {
      config.ios = { ...config.ios,
        runtimeVersion
      };
    }
  }

  if ((_config$android = config.android) !== null && _config$android !== void 0 && _config$android.runtimeVersion || config.runtimeVersion) {
    const runtimeVersion = getRuntimeVersion(config, 'android');

    if (runtimeVersion) {
      config.android = { ...config.android,
        runtimeVersion
      };
    }
  }

  delete config.runtimeVersion;
  return config;
};

exports.withRuntimeVersion = withRuntimeVersion;

function getRuntimeVersionNullable(...[config, platform]) {
  try {
    return getRuntimeVersion(config, platform);
  } catch (e) {
    if ((0, _getenv().boolish)('EXPO_DEBUG', false)) {
      console.log(e);
    }

    return null;
  }
}

function getRuntimeVersion(config, platform) {
  var _config$platform$runt, _config$platform;

  const runtimeVersion = (_config$platform$runt = (_config$platform = config[platform]) === null || _config$platform === void 0 ? void 0 : _config$platform.runtimeVersion) !== null && _config$platform$runt !== void 0 ? _config$platform$runt : config.runtimeVersion;

  if (!runtimeVersion) {
    return null;
  }

  if (typeof runtimeVersion === 'string') {
    return runtimeVersion;
  } else if (runtimeVersion.policy === 'nativeVersion') {
    return getNativeVersion(config, platform);
  } else if (runtimeVersion.policy === 'sdkVersion') {
    if (!config.sdkVersion) {
      throw new Error("An SDK version must be defined when using the 'sdkVersion' runtime policy.");
    }

    return (0, _sdkRuntimeVersions().getRuntimeVersionForSDKVersion)(config.sdkVersion);
  }

  throw new Error(`"${typeof runtimeVersion === 'object' ? JSON.stringify(runtimeVersion) : runtimeVersion}" is not a valid runtime version. getRuntimeVersion only supports a string, "sdkVersion", or "nativeVersion" policy.`);
}

function getSDKVersion(config) {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}

function getUpdatesEnabled(config) {
  var _config$updates3;

  return ((_config$updates3 = config.updates) === null || _config$updates3 === void 0 ? void 0 : _config$updates3.enabled) !== false;
}

function getUpdatesTimeout(config) {
  var _config$updates$fallb, _config$updates4;

  return (_config$updates$fallb = (_config$updates4 = config.updates) === null || _config$updates4 === void 0 ? void 0 : _config$updates4.fallbackToCacheTimeout) !== null && _config$updates$fallb !== void 0 ? _config$updates$fallb : 0;
}

function getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion) {
  var _config$updates5, _config$updates6;

  if (((_config$updates5 = config.updates) === null || _config$updates5 === void 0 ? void 0 : _config$updates5.checkAutomatically) === 'ON_ERROR_RECOVERY') {
    // native 'ERROR_RECOVERY_ONLY' option was only introduced in 0.11.x
    if (expoUpdatesPackageVersion && _semver().default.gte(expoUpdatesPackageVersion, '0.11.0')) {
      return 'ERROR_RECOVERY_ONLY';
    }

    return 'NEVER';
  } else if (((_config$updates6 = config.updates) === null || _config$updates6 === void 0 ? void 0 : _config$updates6.checkAutomatically) === 'ON_LOAD') {
    return 'ALWAYS';
  }

  return 'ALWAYS';
}

function getUpdatesCodeSigningCertificate(projectRoot, config) {
  var _config$updates7;

  const codeSigningCertificatePath = (_config$updates7 = config.updates) === null || _config$updates7 === void 0 ? void 0 : _config$updates7.codeSigningCertificate;

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
  var _config$updates8;

  return (_config$updates8 = config.updates) === null || _config$updates8 === void 0 ? void 0 : _config$updates8.codeSigningMetadata;
}

function getUpdatesCodeSigningMetadataStringified(config) {
  const metadata = getUpdatesCodeSigningMetadata(config);

  if (!metadata) {
    return undefined;
  }

  return JSON.stringify(metadata);
}
//# sourceMappingURL=Updates.js.map