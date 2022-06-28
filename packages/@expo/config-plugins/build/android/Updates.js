"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = void 0;
exports.areVersionsSynced = areVersionsSynced;
exports.ensureBuildGradleContainsConfigurationScript = ensureBuildGradleContainsConfigurationScript;
exports.formatApplyLineForBuildGradle = formatApplyLineForBuildGradle;
exports.isBuildGradleConfigured = isBuildGradleConfigured;
exports.isMainApplicationMetaDataSet = isMainApplicationMetaDataSet;
exports.isMainApplicationMetaDataSynced = isMainApplicationMetaDataSynced;
exports.setUpdatesConfig = setUpdatesConfig;
exports.setVersionsConfig = setVersionsConfig;
exports.withUpdates = void 0;

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

function _androidPlugins() {
  const data = require("../plugins/android-plugins");

  _androidPlugins = function () {
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

function _Manifest() {
  const data = require("./Manifest");

  _Manifest = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CREATE_MANIFEST_ANDROID_PATH = 'expo-updates/scripts/create-manifest-android.gradle';
let Config;
exports.Config = Config;

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

const withUpdates = (config, {
  expoUsername
}) => {
  return (0, _androidPlugins().withAndroidManifest)(config, config => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = (0, _Updates().getExpoUpdatesPackageVersion)(projectRoot);
    config.modResults = setUpdatesConfig(projectRoot, config, config.modResults, expoUsername, expoUpdatesPackageVersion);
    return config;
  });
};

exports.withUpdates = withUpdates;

function setUpdatesConfig(projectRoot, config, androidManifest, username, expoUpdatesPackageVersion) {
  const mainApplication = (0, _Manifest().getMainApplicationOrThrow)(androidManifest);
  (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.ENABLED, String((0, _Updates().getUpdatesEnabled)(config)));
  (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.CHECK_ON_LAUNCH, (0, _Updates().getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion));
  (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.LAUNCH_WAIT_MS, String((0, _Updates().getUpdatesTimeout)(config)));
  const updateUrl = (0, _Updates().getUpdateUrl)(config, username);

  if (updateUrl) {
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.UPDATE_URL, updateUrl);
  } else {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.UPDATE_URL);
  }

  const codeSigningCertificate = (0, _Updates().getUpdatesCodeSigningCertificate)(projectRoot, config);

  if (codeSigningCertificate) {
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.CODE_SIGNING_CERTIFICATE, codeSigningCertificate);
  } else {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.CODE_SIGNING_CERTIFICATE);
  }

  const codeSigningMetadata = (0, _Updates().getUpdatesCodeSigningMetadataStringified)(config);

  if (codeSigningMetadata) {
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.CODE_SIGNING_METADATA, codeSigningMetadata);
  } else {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.CODE_SIGNING_METADATA);
  }

  return setVersionsConfig(config, androidManifest);
}

function setVersionsConfig(config, androidManifest) {
  const mainApplication = (0, _Manifest().getMainApplicationOrThrow)(androidManifest);
  const runtimeVersion = (0, _Updates().getRuntimeVersionNullable)(config, 'android');

  if (!runtimeVersion && (0, _Manifest().findMetaDataItem)(mainApplication, Config.RUNTIME_VERSION) > -1) {
    throw new Error('A runtime version is set in your AndroidManifest.xml, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove expo.modules.updates.EXPO_RUNTIME_VERSION from your AndroidManifest.xml.');
  }

  const sdkVersion = (0, _Updates().getSDKVersion)(config);

  if (runtimeVersion) {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.SDK_VERSION);
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.RUNTIME_VERSION, runtimeVersion);
  } else if (sdkVersion) {
    /**
     * runtime version maybe null in projects using classic updates. In that
     * case we use SDK version
     */
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.RUNTIME_VERSION);
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.SDK_VERSION, sdkVersion);
  } else {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.RUNTIME_VERSION);
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.SDK_VERSION);
  }

  return androidManifest;
}

function ensureBuildGradleContainsConfigurationScript(projectRoot, buildGradleContents) {
  if (!isBuildGradleConfigured(projectRoot, buildGradleContents)) {
    let cleanedUpBuildGradleContents;
    const isBuildGradleMisconfigured = buildGradleContents.split('\n').some(line => line.includes(CREATE_MANIFEST_ANDROID_PATH));

    if (isBuildGradleMisconfigured) {
      cleanedUpBuildGradleContents = buildGradleContents.replace(new RegExp(`(\n// Integration with Expo updates)?\n.*${CREATE_MANIFEST_ANDROID_PATH}.*\n`), '');
    } else {
      cleanedUpBuildGradleContents = buildGradleContents;
    }

    const gradleScriptApply = formatApplyLineForBuildGradle(projectRoot);
    return `${cleanedUpBuildGradleContents}\n// Integration with Expo updates\n${gradleScriptApply}\n`;
  } else {
    return buildGradleContents;
  }
}

function formatApplyLineForBuildGradle(projectRoot) {
  const updatesGradleScriptPath = _resolveFrom().default.silent(projectRoot, CREATE_MANIFEST_ANDROID_PATH);

  if (!updatesGradleScriptPath) {
    throw new Error("Could not find the build script for Android. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date.");
  }

  const relativePath = _path().default.relative(_path().default.join(projectRoot, 'android', 'app'), updatesGradleScriptPath);

  const posixPath = process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;
  return `apply from: "${posixPath}"`;
}

function isBuildGradleConfigured(projectRoot, buildGradleContents) {
  const androidBuildScript = formatApplyLineForBuildGradle(projectRoot);
  return buildGradleContents.replace(/\r\n/g, '\n').split('\n') // Check for both single and double quotes
  .some(line => line === androidBuildScript || line === androidBuildScript.replace(/"/g, "'"));
}

function isMainApplicationMetaDataSet(androidManifest) {
  const updateUrl = (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.UPDATE_URL);
  const runtimeVersion = (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.RUNTIME_VERSION);
  const sdkVersion = (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.SDK_VERSION);
  return Boolean(updateUrl && (sdkVersion || runtimeVersion));
}

function isMainApplicationMetaDataSynced(projectRoot, config, androidManifest, username) {
  return (0, _Updates().getUpdateUrl)(config, username) === (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.UPDATE_URL) && String((0, _Updates().getUpdatesEnabled)(config)) === (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.ENABLED) && String((0, _Updates().getUpdatesTimeout)(config)) === (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.LAUNCH_WAIT_MS) && (0, _Updates().getUpdatesCheckOnLaunch)(config) === (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.CHECK_ON_LAUNCH) && (0, _Updates().getUpdatesCodeSigningCertificate)(projectRoot, config) === (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.CODE_SIGNING_CERTIFICATE) && (0, _Updates().getUpdatesCodeSigningMetadataStringified)(config) === (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.CODE_SIGNING_METADATA) && areVersionsSynced(config, androidManifest);
}

function areVersionsSynced(config, androidManifest) {
  const expectedRuntimeVersion = (0, _Updates().getRuntimeVersionNullable)(config, 'android');
  const expectedSdkVersion = (0, _Updates().getSDKVersion)(config);
  const currentRuntimeVersion = (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.RUNTIME_VERSION);
  const currentSdkVersion = (0, _Manifest().getMainApplicationMetaDataValue)(androidManifest, Config.SDK_VERSION);

  if (expectedRuntimeVersion !== null) {
    return currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === null;
  } else if (expectedSdkVersion !== null) {
    return currentSdkVersion === expectedSdkVersion && currentRuntimeVersion === null;
  } else {
    return true;
  }
}
//# sourceMappingURL=Updates.js.map