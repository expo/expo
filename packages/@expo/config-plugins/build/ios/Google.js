"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGoogleServicesFile = getGoogleServicesFile;
exports.getGoogleSignInReversedClientId = getGoogleSignInReversedClientId;
exports.setGoogleConfig = setGoogleConfig;
exports.setGoogleServicesFile = setGoogleServicesFile;
exports.setGoogleSignInReversedClientId = setGoogleSignInReversedClientId;
exports.withGoogleServicesFile = exports.withGoogle = void 0;
function _plist() {
  const data = _interopRequireDefault(require("@expo/plist"));
  _plist = function () {
    return data;
  };
  return data;
}
function _assert() {
  const data = _interopRequireDefault(require("assert"));
  _assert = function () {
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
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _Paths() {
  const data = require("./Paths");
  _Paths = function () {
    return data;
  };
  return data;
}
function _Scheme() {
  const data = require("./Scheme");
  _Scheme = function () {
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
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const withGoogle = config => {
  return (0, _iosPlugins().withInfoPlist)(config, config => {
    config.modResults = setGoogleConfig(config, config.modResults, config.modRequest);
    return config;
  });
};
exports.withGoogle = withGoogle;
const withGoogleServicesFile = config => {
  return (0, _iosPlugins().withXcodeProject)(config, config => {
    config.modResults = setGoogleServicesFile(config, {
      projectRoot: config.modRequest.projectRoot,
      project: config.modResults
    });
    return config;
  });
};
exports.withGoogleServicesFile = withGoogleServicesFile;
function readGoogleServicesInfoPlist(relativePath, {
  projectRoot
}) {
  const googleServiceFilePath = _path().default.resolve(projectRoot, relativePath);
  const contents = _fs().default.readFileSync(googleServiceFilePath, 'utf8');
  (0, _assert().default)(contents, 'GoogleService-Info.plist is empty');
  return _plist().default.parse(contents);
}
function getGoogleSignInReversedClientId(config, modRequest) {
  const googleServicesFileRelativePath = getGoogleServicesFile(config);
  if (googleServicesFileRelativePath === null) {
    return null;
  }
  const infoPlist = readGoogleServicesInfoPlist(googleServicesFileRelativePath, modRequest);
  return infoPlist.REVERSED_CLIENT_ID ?? null;
}
function getGoogleServicesFile(config) {
  return config.ios?.googleServicesFile ?? null;
}
function setGoogleSignInReversedClientId(config, infoPlist, modRequest) {
  const reversedClientId = getGoogleSignInReversedClientId(config, modRequest);
  if (reversedClientId === null) {
    return infoPlist;
  }
  return (0, _Scheme().appendScheme)(reversedClientId, infoPlist);
}
function setGoogleConfig(config, infoPlist, modRequest) {
  infoPlist = setGoogleSignInReversedClientId(config, infoPlist, modRequest);
  return infoPlist;
}
function setGoogleServicesFile(config, {
  projectRoot,
  project
}) {
  const googleServicesFileRelativePath = getGoogleServicesFile(config);
  if (googleServicesFileRelativePath === null) {
    return project;
  }
  const googleServiceFilePath = _path().default.resolve(projectRoot, googleServicesFileRelativePath);
  _fs().default.copyFileSync(googleServiceFilePath, _path().default.join((0, _Paths().getSourceRoot)(projectRoot), 'GoogleService-Info.plist'));
  const projectName = (0, _Xcodeproj().getProjectName)(projectRoot);
  const plistFilePath = `${projectName}/GoogleService-Info.plist`;
  if (!project.hasFile(plistFilePath)) {
    project = (0, _Xcodeproj().addResourceFileToGroup)({
      filepath: plistFilePath,
      groupName: projectName,
      project,
      isBuildFile: true,
      verbose: true
    });
  }
  return project;
}
//# sourceMappingURL=Google.js.map