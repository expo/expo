"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBranchApiKey = getBranchApiKey;
exports.setBranchApiKey = setBranchApiKey;
exports.withAndroidBranch = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
    return data;
  };

  return data;
}

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication
} = _configPlugins().AndroidConfig.Manifest;

const META_BRANCH_KEY = 'io.branch.sdk.BranchKey';

const withAndroidBranch = config => {
  return (0, _configPlugins().withAndroidManifest)(config, config => {
    config.modResults = setBranchApiKey(config, config.modResults);
    return config;
  });
};

exports.withAndroidBranch = withAndroidBranch;

function getBranchApiKey(config) {
  var _config$android$confi, _config$android, _config$android$confi2, _config$android$confi3;

  return (_config$android$confi = (_config$android = config.android) === null || _config$android === void 0 ? void 0 : (_config$android$confi2 = _config$android.config) === null || _config$android$confi2 === void 0 ? void 0 : (_config$android$confi3 = _config$android$confi2.branch) === null || _config$android$confi3 === void 0 ? void 0 : _config$android$confi3.apiKey) !== null && _config$android$confi !== void 0 ? _config$android$confi : null;
}

function setBranchApiKey(config, androidManifest) {
  const apiKey = getBranchApiKey(config);
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  if (apiKey) {
    // If the item exists, add it back
    addMetaDataItemToMainApplication(mainApplication, META_BRANCH_KEY, apiKey);
  } else {
    // Remove any existing item
    removeMetaDataItemFromMainApplication(mainApplication, META_BRANCH_KEY);
  }

  return androidManifest;
}
//# sourceMappingURL=withAndroidBranch.js.map