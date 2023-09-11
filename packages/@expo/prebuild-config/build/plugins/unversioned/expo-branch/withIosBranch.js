"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBranchApiKey = getBranchApiKey;
exports.setBranchApiKey = setBranchApiKey;
exports.withIosBranch = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
const withIosBranch = config => {
  return (0, _configPlugins().withInfoPlist)(config, config => {
    config.modResults = setBranchApiKey(config, config.modResults);
    return config;
  });
};
exports.withIosBranch = withIosBranch;
function getBranchApiKey(config) {
  var _config$ios$config$br, _config$ios, _config$ios$config, _config$ios$config$br2;
  return (_config$ios$config$br = (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : (_config$ios$config = _config$ios.config) === null || _config$ios$config === void 0 ? void 0 : (_config$ios$config$br2 = _config$ios$config.branch) === null || _config$ios$config$br2 === void 0 ? void 0 : _config$ios$config$br2.apiKey) !== null && _config$ios$config$br !== void 0 ? _config$ios$config$br : null;
}
function setBranchApiKey(config, infoPlist) {
  const apiKey = getBranchApiKey(config);
  if (apiKey === null) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    branch_key: {
      live: apiKey
    }
  };
}
//# sourceMappingURL=withIosBranch.js.map