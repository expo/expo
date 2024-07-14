"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withUpdates = exports.setVersionsConfigAsync = exports.setUpdatesConfigAsync = exports.Config = void 0;
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
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
  Config["ENABLED"] = "EXUpdatesEnabled";
  Config["CHECK_ON_LAUNCH"] = "EXUpdatesCheckOnLaunch";
  Config["LAUNCH_WAIT_MS"] = "EXUpdatesLaunchWaitMs";
  Config["RUNTIME_VERSION"] = "EXUpdatesRuntimeVersion";
  Config["UPDATE_URL"] = "EXUpdatesURL";
  Config["UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY"] = "EXUpdatesRequestHeaders";
  Config["CODE_SIGNING_CERTIFICATE"] = "EXUpdatesCodeSigningCertificate";
  Config["CODE_SIGNING_METADATA"] = "EXUpdatesCodeSigningMetadata";
  return Config;
}({}); // when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/
const withUpdates = applePlatform => config => {
  return (0, _applePlugins().withExpoPlist)(applePlatform)(config, async config => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = (0, _Updates().getExpoUpdatesPackageVersion)(projectRoot);
    config.modResults = await setUpdatesConfigAsync(applePlatform)(projectRoot, config, config.modResults, expoUpdatesPackageVersion);
    return config;
  });
};
exports.withUpdates = withUpdates;
const setUpdatesConfigAsync = applePlatform => async (projectRoot, config, expoPlist, expoUpdatesPackageVersion) => {
  const newExpoPlist = {
    ...expoPlist,
    [Config.ENABLED]: (0, _Updates().getUpdatesEnabled)(config),
    [Config.CHECK_ON_LAUNCH]: (0, _Updates().getUpdatesCheckOnLaunch)(config, expoUpdatesPackageVersion),
    [Config.LAUNCH_WAIT_MS]: (0, _Updates().getUpdatesTimeout)(config)
  };
  const updateUrl = (0, _Updates().getUpdateUrl)(config);
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
  return await setVersionsConfigAsync(applePlatform)(projectRoot, config, newExpoPlist);
};
exports.setUpdatesConfigAsync = setUpdatesConfigAsync;
const setVersionsConfigAsync = applePlatform => async (projectRoot, config, expoPlist) => {
  const newExpoPlist = {
    ...expoPlist
  };
  const runtimeVersion = await (0, _Updates().getRuntimeVersionNullableAsync)(projectRoot, config, applePlatform);
  if (!runtimeVersion && expoPlist[Config.RUNTIME_VERSION]) {
    throw new Error('A runtime version is set in your Expo.plist, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove EXUpdatesRuntimeVersion from your Expo.plist.');
  }
  if (runtimeVersion) {
    delete newExpoPlist['EXUpdatesSDKVersion'];
    newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
  } else {
    delete newExpoPlist['EXUpdatesSDKVersion'];
    delete newExpoPlist[Config.RUNTIME_VERSION];
  }
  return newExpoPlist;
};
exports.setVersionsConfigAsync = setVersionsConfigAsync;
//# sourceMappingURL=Updates.js.map