"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergePrivacyInfo = mergePrivacyInfo;
exports.setPrivacyInfo = setPrivacyInfo;
exports.withPrivacyInfo = withPrivacyInfo;
function _plist() {
  const data = _interopRequireDefault(require("@expo/plist"));
  _plist = function () {
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
function _XcodeProjectFile() {
  const data = require("./XcodeProjectFile");
  _XcodeProjectFile = function () {
    return data;
  };
  return data;
}
function _Xcodeproj() {
  const data = require("./utils/Xcodeproj");
  _Xcodeproj = function () {
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
function withPrivacyInfo(config) {
  var _config$ios;
  const privacyManifests = (_config$ios = config.ios) === null || _config$ios === void 0 ? void 0 : _config$ios.privacyManifests;
  if (!privacyManifests) {
    return config;
  }
  return (0, _().withXcodeProject)(config, projectConfig => {
    return setPrivacyInfo(projectConfig, privacyManifests);
  });
}
function setPrivacyInfo(projectConfig, privacyManifests) {
  const projectName = (0, _Xcodeproj().getProjectName)(projectConfig.modRequest.projectRoot);
  const existingFileContent = (0, _XcodeProjectFile().readBuildSourceFile)({
    project: projectConfig.modResults,
    nativeProjectRoot: projectConfig.modRequest.platformProjectRoot,
    filePath: _path().default.join(projectName, 'PrivacyInfo.xcprivacy')
  });
  const parsedContent = existingFileContent ? _plist().default.parse(existingFileContent) : {};
  const mergedContent = mergePrivacyInfo(parsedContent, privacyManifests);
  const contents = _plist().default.build(mergedContent);
  projectConfig.modResults = (0, _XcodeProjectFile().createBuildSourceFile)({
    project: projectConfig.modResults,
    nativeProjectRoot: projectConfig.modRequest.platformProjectRoot,
    fileContents: contents,
    filePath: _path().default.join(projectName, 'PrivacyInfo.xcprivacy'),
    overwrite: true
  });
  return projectConfig;
}
function mergePrivacyInfo(existing, privacyManifests) {
  var _ref, _privacyManifests$NSP, _privacyManifests$NSP2, _privacyManifests$NSP3, _privacyManifests$NSP4;
  let {
    NSPrivacyAccessedAPITypes = [],
    NSPrivacyCollectedDataTypes = [],
    NSPrivacyTracking = false,
    NSPrivacyTrackingDomains = []
  } = structuredClone(existing);
  // tracking is a boolean, so we can just overwrite it
  NSPrivacyTracking = (_ref = (_privacyManifests$NSP = privacyManifests.NSPrivacyTracking) !== null && _privacyManifests$NSP !== void 0 ? _privacyManifests$NSP : existing.NSPrivacyTracking) !== null && _ref !== void 0 ? _ref : false;
  // merge the api types – for each type ensure the key is in the array, and if it is add the reason if it's not there
  (_privacyManifests$NSP2 = privacyManifests.NSPrivacyAccessedAPITypes) === null || _privacyManifests$NSP2 === void 0 ? void 0 : _privacyManifests$NSP2.forEach(newType => {
    const existingType = NSPrivacyAccessedAPITypes.find(t => t.NSPrivacyAccessedAPIType === newType.NSPrivacyAccessedAPIType);
    if (!existingType) {
      NSPrivacyAccessedAPITypes.push(newType);
    } else {
      var _existingType$NSPriva;
      existingType.NSPrivacyAccessedAPITypeReasons = [...new Set(existingType === null || existingType === void 0 ? void 0 : (_existingType$NSPriva = existingType.NSPrivacyAccessedAPITypeReasons) === null || _existingType$NSPriva === void 0 ? void 0 : _existingType$NSPriva.concat(...newType.NSPrivacyAccessedAPITypeReasons))];
    }
  });
  // merge the collected data types – for each type ensure the key is in the array, and if it is add the purposes if it's not there
  (_privacyManifests$NSP3 = privacyManifests.NSPrivacyCollectedDataTypes) === null || _privacyManifests$NSP3 === void 0 ? void 0 : _privacyManifests$NSP3.forEach(newType => {
    const existingType = NSPrivacyCollectedDataTypes.find(t => t.NSPrivacyCollectedDataType === newType.NSPrivacyCollectedDataType);
    if (!existingType) {
      NSPrivacyCollectedDataTypes.push(newType);
    } else {
      var _existingType$NSPriva2;
      existingType.NSPrivacyCollectedDataTypePurposes = [...new Set(existingType === null || existingType === void 0 ? void 0 : (_existingType$NSPriva2 = existingType.NSPrivacyCollectedDataTypePurposes) === null || _existingType$NSPriva2 === void 0 ? void 0 : _existingType$NSPriva2.concat(...newType.NSPrivacyCollectedDataTypePurposes))];
    }
  });
  // merge the tracking domains
  NSPrivacyTrackingDomains = [...new Set(NSPrivacyTrackingDomains.concat((_privacyManifests$NSP4 = privacyManifests.NSPrivacyTrackingDomains) !== null && _privacyManifests$NSP4 !== void 0 ? _privacyManifests$NSP4 : []))];
  return {
    NSPrivacyAccessedAPITypes,
    NSPrivacyCollectedDataTypes,
    NSPrivacyTracking,
    NSPrivacyTrackingDomains
  };
}
//# sourceMappingURL=PrivacyInfo.js.map