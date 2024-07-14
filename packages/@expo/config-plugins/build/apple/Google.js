"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withGoogleServicesFile = exports.withGoogle = exports.setGoogleSignInReversedClientId = exports.setGoogleServicesFile = exports.setGoogleConfig = exports.getGoogleSignInReversedClientId = exports.getGoogleServicesFile = void 0;
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
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const withGoogle = applePlatform => config => {
  return (0, _applePlugins().withInfoPlist)(applePlatform)(config, config => {
    config.modResults = setGoogleConfig(applePlatform)(config, config.modResults, config.modRequest);
    return config;
  });
};
exports.withGoogle = withGoogle;
const withGoogleServicesFile = applePlatform => config => {
  return (0, _applePlugins().withXcodeProject)(applePlatform)(config, config => {
    config.modResults = setGoogleServicesFile(applePlatform)(config, {
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
const getGoogleSignInReversedClientId = applePlatform => (config, modRequest) => {
  const googleServicesFileRelativePath = getGoogleServicesFile(applePlatform)(config);
  if (googleServicesFileRelativePath === null) {
    return null;
  }
  const infoPlist = readGoogleServicesInfoPlist(googleServicesFileRelativePath, modRequest);
  return infoPlist.REVERSED_CLIENT_ID ?? null;
};
exports.getGoogleSignInReversedClientId = getGoogleSignInReversedClientId;
const getGoogleServicesFile = applePlatform => config => {
  return config[applePlatform]?.googleServicesFile ?? null;
};
exports.getGoogleServicesFile = getGoogleServicesFile;
const setGoogleSignInReversedClientId = applePlatform => (config, infoPlist, modRequest) => {
  const reversedClientId = getGoogleSignInReversedClientId(applePlatform)(config, modRequest);
  if (reversedClientId === null) {
    return infoPlist;
  }
  return (0, _Scheme().appendScheme)(reversedClientId, infoPlist);
};
exports.setGoogleSignInReversedClientId = setGoogleSignInReversedClientId;
const setGoogleConfig = applePlatform => (config, infoPlist, modRequest) => {
  infoPlist = setGoogleSignInReversedClientId(applePlatform)(config, infoPlist, modRequest);
  return infoPlist;
};
exports.setGoogleConfig = setGoogleConfig;
const setGoogleServicesFile = applePlatform => (config, {
  projectRoot,
  project
}) => {
  const googleServicesFileRelativePath = getGoogleServicesFile(applePlatform)(config);
  if (googleServicesFileRelativePath === null) {
    return project;
  }
  const googleServiceFilePath = _path().default.resolve(projectRoot, googleServicesFileRelativePath);
  _fs().default.copyFileSync(googleServiceFilePath, _path().default.join((0, _Paths().getSourceRoot)(applePlatform)(projectRoot), 'GoogleService-Info.plist'));
  const projectName = (0, _Xcodeproj().getProjectName)(applePlatform)(projectRoot);
  const plistFilePath = `${projectName}/GoogleService-Info.plist`;
  if (!project.hasFile(plistFilePath)) {
    project = (0, _Xcodeproj().addResourceFileToGroup)(applePlatform)({
      filepath: plistFilePath,
      groupName: projectName,
      project,
      isBuildFile: true,
      verbose: true
    });
  }
  return project;
};
exports.setGoogleServicesFile = setGoogleServicesFile;
//# sourceMappingURL=Google.js.map