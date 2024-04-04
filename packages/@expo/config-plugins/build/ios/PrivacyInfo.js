"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withPrivacyInfo = withPrivacyInfo;
function _XcodeProjectFile() {
  const data = require("./XcodeProjectFile");
  _XcodeProjectFile = function () {
    return data;
  };
  return data;
}
function _plist() {
  const data = _interopRequireDefault(require("@expo/plist"));
  _plist = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withPrivacyInfo(config) {
  var _config$ios, _config$ios2;
  if (!((_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.privacyManifests)) {
    return config;
  }
  const {
    NSPrivacyAccessedAPITypes = [],
    NSPrivacyCollectedDataTypes = [],
    NSPrivacyTracking = false,
    NSPrivacyTrackingDomains = []
  } = (_config$ios2 = config.ios) === null || _config$ios2 === void 0 ? void 0 : _config$ios2.privacyManifests;
  const contents = _plist().default.build({
    NSPrivacyCollectedDataTypes,
    NSPrivacyTracking,
    NSPrivacyTrackingDomains,
    NSPrivacyAccessedAPITypes
  });
  return (0, _XcodeProjectFile().withBuildSourceFile)(config, {
    filePath: 'PrivacyInfo.xcprivacy',
    contents,
    overwrite: true
  });
}
//# sourceMappingURL=PrivacyInfo.js.map