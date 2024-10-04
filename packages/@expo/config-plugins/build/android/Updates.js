"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Config = void 0;
exports.applyRuntimeVersionFromConfigAsync = applyRuntimeVersionFromConfigAsync;
exports.applyRuntimeVersionFromConfigForProjectRootAsync = applyRuntimeVersionFromConfigForProjectRootAsync;
exports.setUpdatesConfigAsync = setUpdatesConfigAsync;
exports.setVersionsConfigAsync = setVersionsConfigAsync;
exports.withUpdates = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _Resources() {
  const data = require("./Resources");
  _Resources = function () {
    return data;
  };
  return data;
}
function _Strings() {
  const data = require("./Strings");
  _Strings = function () {
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
function _withPlugins() {
  const data = require("../plugins/withPlugins");
  _withPlugins = function () {
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
let Config = exports.Config = /*#__PURE__*/function (Config) {
  Config["ENABLED"] = "expo.modules.updates.ENABLED";
  Config["CHECK_ON_LAUNCH"] = "expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH";
  Config["LAUNCH_WAIT_MS"] = "expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS";
  Config["RUNTIME_VERSION"] = "expo.modules.updates.EXPO_RUNTIME_VERSION";
  Config["UPDATE_URL"] = "expo.modules.updates.EXPO_UPDATE_URL";
  Config["UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY"] = "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY";
  Config["CODE_SIGNING_CERTIFICATE"] = "expo.modules.updates.CODE_SIGNING_CERTIFICATE";
  Config["CODE_SIGNING_METADATA"] = "expo.modules.updates.CODE_SIGNING_METADATA";
  return Config;
}({}); // when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/
const withUpdates = config => {
  return (0, _withPlugins().withPlugins)(config, [withUpdatesManifest, withRuntimeVersionResource]);
};
exports.withUpdates = withUpdates;
const withUpdatesManifest = config => {
  return (0, _androidPlugins().withAndroidManifest)(config, async config => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = (0, _Updates().getExpoUpdatesPackageVersion)(projectRoot);
    config.modResults = await setUpdatesConfigAsync(projectRoot, config, config.modResults, expoUpdatesPackageVersion);
    return config;
  });
};
const withRuntimeVersionResource = (0, _androidPlugins().createStringsXmlPlugin)(applyRuntimeVersionFromConfigAsync, 'withRuntimeVersionResource');
async function applyRuntimeVersionFromConfigAsync(config, stringsJSON) {
  const projectRoot = config.modRequest.projectRoot;
  return await applyRuntimeVersionFromConfigForProjectRootAsync(projectRoot, config, stringsJSON);
}
async function applyRuntimeVersionFromConfigForProjectRootAsync(projectRoot, config, stringsJSON) {
  const runtimeVersion = await (0, _Updates().getRuntimeVersionNullableAsync)(projectRoot, config, 'android');
  if (runtimeVersion) {
    return (0, _Strings().setStringItem)([(0, _Resources().buildResourceItem)({
      name: 'expo_runtime_version',
      value: runtimeVersion
    })], stringsJSON);
  }
  return (0, _Strings().removeStringItem)('expo_runtime_version', stringsJSON);
}
async function setUpdatesConfigAsync(projectRoot, config, androidManifest, expoUpdatesPackageVersion) {
  const mainApplication = (0, _Manifest().getMainApplicationOrThrow)(androidManifest);
  (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.ENABLED, String((0, _Updates().getUpdatesEnabled)(config)));
  (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.CHECK_ON_LAUNCH, (0, _Updates().getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion));
  (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.LAUNCH_WAIT_MS, String((0, _Updates().getUpdatesTimeout)(config)));
  const updateUrl = (0, _Updates().getUpdateUrl)(config);
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
  const requestHeaders = (0, _Updates().getUpdatesRequestHeadersStringified)(config);
  if (requestHeaders) {
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY, requestHeaders);
  } else {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY);
  }
  return await setVersionsConfigAsync(projectRoot, config, androidManifest);
}
async function setVersionsConfigAsync(projectRoot, config, androidManifest) {
  const mainApplication = (0, _Manifest().getMainApplicationOrThrow)(androidManifest);
  const runtimeVersion = await (0, _Updates().getRuntimeVersionNullableAsync)(projectRoot, config, 'android');
  if (!runtimeVersion && (0, _Manifest().findMetaDataItem)(mainApplication, Config.RUNTIME_VERSION) > -1) {
    throw new Error('A runtime version is set in your AndroidManifest.xml, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove expo.modules.updates.EXPO_RUNTIME_VERSION from your AndroidManifest.xml.');
  }
  if (runtimeVersion) {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, 'expo.modules.updates.EXPO_SDK_VERSION');
    (0, _Manifest().addMetaDataItemToMainApplication)(mainApplication, Config.RUNTIME_VERSION, '@string/expo_runtime_version');
  } else {
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, Config.RUNTIME_VERSION);
    (0, _Manifest().removeMetaDataItemFromMainApplication)(mainApplication, 'expo.modules.updates.EXPO_SDK_VERSION');
  }
  return androidManifest;
}
//# sourceMappingURL=Updates.js.map