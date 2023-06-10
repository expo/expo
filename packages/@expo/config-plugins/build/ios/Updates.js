"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = void 0;
exports.ensureBundleReactNativePhaseContainsConfigurationScript = ensureBundleReactNativePhaseContainsConfigurationScript;
exports.getBundleReactNativePhase = getBundleReactNativePhase;
exports.isPlistConfigurationSet = isPlistConfigurationSet;
exports.isPlistConfigurationSynced = isPlistConfigurationSynced;
exports.isPlistVersionConfigurationSynced = isPlistVersionConfigurationSynced;
exports.isShellScriptBuildPhaseConfigured = isShellScriptBuildPhaseConfigured;
exports.setUpdatesConfig = setUpdatesConfig;
exports.setVersionsConfig = setVersionsConfig;
exports.withUpdates = void 0;
function path() {
  const data = _interopRequireWildcard(require("path"));
  path = function () {
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
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _Updates() {
  const data = require("../utils/Updates");
  _Updates = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const CREATE_MANIFEST_IOS_PATH = 'expo-updates/scripts/create-manifest-ios.sh';
let Config; // when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/
exports.Config = Config;
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
const withUpdates = (config, {
  expoUsername
}) => {
  return (0, _iosPlugins().withExpoPlist)(config, config => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = (0, _Updates().getExpoUpdatesPackageVersion)(projectRoot);
    config.modResults = setUpdatesConfig(projectRoot, config, config.modResults, expoUsername, expoUpdatesPackageVersion);
    return config;
  });
};
exports.withUpdates = withUpdates;
function setUpdatesConfig(projectRoot, config, expoPlist, username, expoUpdatesPackageVersion) {
  const newExpoPlist = {
    ...expoPlist,
    [Config.ENABLED]: (0, _Updates().getUpdatesEnabled)(config, username),
    [Config.CHECK_ON_LAUNCH]: (0, _Updates().getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion),
    [Config.LAUNCH_WAIT_MS]: (0, _Updates().getUpdatesTimeout)(config)
  };
  const updateUrl = (0, _Updates().getUpdateUrl)(config, username);
  if (updateUrl) {
    newExpoPlist[Config.UPDATE_URL] = updateUrl;
  } else {
    delete newExpoPlist[Config.UPDATE_URL];
  }
  const codeSigningCertificate = (0, _Updates().getUpdatesCodeSigningCertificate)(projectRoot, config);
  if (codeSigningCertificate) {
    newExpoPlist[Config.CODE_SIGNING_CERTIFICATE] = codeSigningCertificate;
  } else {
    delete newExpoPlist[Config.CODE_SIGNING_CERTIFICATE];
  }
  const codeSigningMetadata = (0, _Updates().getUpdatesCodeSigningMetadata)(config);
  if (codeSigningMetadata) {
    newExpoPlist[Config.CODE_SIGNING_METADATA] = codeSigningMetadata;
  } else {
    delete newExpoPlist[Config.CODE_SIGNING_METADATA];
  }
  const requestHeaders = (0, _Updates().getUpdatesRequestHeaders)(config);
  if (requestHeaders) {
    newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY] = requestHeaders;
  } else {
    delete newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY];
  }
  return setVersionsConfig(config, newExpoPlist);
}
function setVersionsConfig(config, expoPlist) {
  const newExpoPlist = {
    ...expoPlist
  };
  const runtimeVersion = (0, _Updates().getRuntimeVersionNullable)(config, 'ios');
  if (!runtimeVersion && expoPlist[Config.RUNTIME_VERSION]) {
    throw new Error('A runtime version is set in your Expo.plist, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove EXUpdatesRuntimeVersion from your Expo.plist.');
  }
  const sdkVersion = (0, _Updates().getSDKVersion)(config);
  if (runtimeVersion) {
    delete newExpoPlist[Config.SDK_VERSION];
    newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
  } else if (sdkVersion) {
    /**
     * runtime version maybe null in projects using classic updates. In that
     * case we use SDK version
     */
    delete newExpoPlist[Config.RUNTIME_VERSION];
    newExpoPlist[Config.SDK_VERSION] = sdkVersion;
  } else {
    delete newExpoPlist[Config.SDK_VERSION];
    delete newExpoPlist[Config.RUNTIME_VERSION];
  }
  return newExpoPlist;
}
function formatConfigurationScriptPath(projectRoot) {
  const buildScriptPath = _resolveFrom().default.silent(projectRoot, CREATE_MANIFEST_IOS_PATH);
  if (!buildScriptPath) {
    throw new Error("Could not find the build script for iOS. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
  }
  const relativePath = path().relative(path().join(projectRoot, 'ios'), buildScriptPath);
  return process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;
}
function getBundleReactNativePhase(project) {
  const shellScriptBuildPhase = project.hash.project.objects.PBXShellScriptBuildPhase;
  const bundleReactNative = Object.values(shellScriptBuildPhase).find(buildPhase => buildPhase.name === '"Bundle React Native code and images"');
  if (!bundleReactNative) {
    throw new Error(`Couldn't find a build phase "Bundle React Native code and images"`);
  }
  return bundleReactNative;
}
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
function isShellScriptBuildPhaseConfigured(projectRoot, project) {
  const bundleReactNative = getBundleReactNativePhase(project);
  const buildPhaseShellScriptPath = formatConfigurationScriptPath(projectRoot);
  return bundleReactNative.shellScript.includes(buildPhaseShellScriptPath);
}
function isPlistConfigurationSet(expoPlist) {
  return Boolean(expoPlist.EXUpdatesURL && (expoPlist.EXUpdatesSDKVersion || expoPlist.EXUpdatesRuntimeVersion));
}
function isPlistConfigurationSynced(projectRoot, config, expoPlist, username) {
  return (0, _Updates().getUpdateUrl)(config, username) === expoPlist.EXUpdatesURL && (0, _Updates().getUpdatesEnabled)(config, username) === expoPlist.EXUpdatesEnabled && (0, _Updates().getUpdatesTimeout)(config) === expoPlist.EXUpdatesLaunchWaitMs && (0, _Updates().getUpdatesCheckOnLaunch)(config) === expoPlist.EXUpdatesCheckOnLaunch && (0, _Updates().getUpdatesCodeSigningCertificate)(projectRoot, config) === expoPlist.EXUpdatesCodeSigningCertificate && (0, _Updates().getUpdatesCodeSigningMetadata)(config) === expoPlist.EXUpdatesCodeSigningMetadata && isPlistVersionConfigurationSynced(config, expoPlist);
}
function isPlistVersionConfigurationSynced(config, expoPlist) {
  var _expoPlist$EXUpdatesR, _expoPlist$EXUpdatesS;
  const expectedRuntimeVersion = (0, _Updates().getRuntimeVersionNullable)(config, 'ios');
  const expectedSdkVersion = (0, _Updates().getSDKVersion)(config);
  const currentRuntimeVersion = (_expoPlist$EXUpdatesR = expoPlist.EXUpdatesRuntimeVersion) !== null && _expoPlist$EXUpdatesR !== void 0 ? _expoPlist$EXUpdatesR : null;
  const currentSdkVersion = (_expoPlist$EXUpdatesS = expoPlist.EXUpdatesSDKVersion) !== null && _expoPlist$EXUpdatesS !== void 0 ? _expoPlist$EXUpdatesS : null;
  if (expectedRuntimeVersion !== null) {
    return currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === null;
  } else if (expectedSdkVersion !== null) {
    return currentSdkVersion === expectedSdkVersion && currentRuntimeVersion === null;
  } else {
    return true;
  }
}
//# sourceMappingURL=Updates.js.map