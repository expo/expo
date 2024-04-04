"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withPrivacyInfo = withPrivacyInfo;
function _plist() {
  const data = _interopRequireDefault(require("@expo/plist"));
  _plist = function () {
    return data;
  };
  return data;
}
function _XcodeProjectFile() {
  const data = require("./XcodeProjectFile");
  _XcodeProjectFile = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function withPrivacyInfo(config) {
  if (!config.ios?.privacyManifests) {
    return config;
  }
  const {
    NSPrivacyAccessedAPITypes = [],
    NSPrivacyCollectedDataTypes = [],
    NSPrivacyTracking = false,
    NSPrivacyTrackingDomains = []
  } = config.ios?.privacyManifests;
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