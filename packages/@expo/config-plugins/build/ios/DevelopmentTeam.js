"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDevelopmentTeam = getDevelopmentTeam;
exports.setDevelopmentTeamForBuildConfiguration = setDevelopmentTeamForBuildConfiguration;
exports.setDevelopmentTeamForPbxproj = setDevelopmentTeamForPbxproj;
exports.updateDevelopmentTeamForPbxproj = updateDevelopmentTeamForPbxproj;
exports.withDevelopmentTeam = void 0;
function _nodeFs() {
  const data = _interopRequireDefault(require("node:fs"));
  _nodeFs = function () {
    return data;
  };
  return data;
}
function _xcode() {
  const data = _interopRequireDefault(require("xcode"));
  _xcode = function () {
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
function _Target() {
  const data = require("./Target");
  _Target = function () {
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
function _string() {
  const data = require("./utils/string");
  _string = function () {
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
/**
 * Set the Apple development team ID for all build configurations using the first native target.
 */
const withDevelopmentTeam = (config, {
  appleTeamId
} = {}) => {
  return (0, _iosPlugins().withXcodeProject)(config, config => {
    const teamId = appleTeamId ?? getDevelopmentTeam(config);
    if (teamId) {
      config.modResults = updateDevelopmentTeamForPbxproj(config.modResults, teamId);
    }
    return config;
  });
};

/** Get the Apple development team ID from Expo config, if defined */
exports.withDevelopmentTeam = withDevelopmentTeam;
function getDevelopmentTeam(config) {
  return config.ios?.appleTeamId ?? null;
}

/** Set the Apple development team ID for an XCBuildConfiguration object */
function setDevelopmentTeamForBuildConfiguration(xcBuildConfiguration, developmentTeam) {
  if (developmentTeam) {
    xcBuildConfiguration.buildSettings.DEVELOPMENT_TEAM = (0, _string().trimQuotes)(developmentTeam);
  } else {
    delete xcBuildConfiguration.buildSettings.DEVELOPMENT_TEAM;
  }
}

/**
 * Update the Apple development team ID for all XCBuildConfiguration entries, in all native targets.
 *
 * A development team is stored as a value in XCBuildConfiguration entry.
 * Those entries exist for every pair (build target, build configuration).
 * Unless target name is passed, the first target defined in the pbxproj is used
 * (to keep compatibility with the inaccurate legacy implementation of this function).
 */
function updateDevelopmentTeamForPbxproj(project, appleTeamId) {
  const nativeTargets = (0, _Target().getNativeTargets)(project);
  nativeTargets.forEach(([, nativeTarget]) => {
    (0, _Xcodeproj().getBuildConfigurationsForListId)(project, nativeTarget.buildConfigurationList).forEach(([, buildConfig]) => setDevelopmentTeamForBuildConfiguration(buildConfig, appleTeamId));
  });
  return project;
}

/**
 * Updates the Apple development team ID for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {[string]} appleTeamId Desired Apple development team ID
 */
function setDevelopmentTeamForPbxproj(projectRoot, appleTeamId) {
  // Get all pbx projects in the ${projectRoot}/ios directory
  const pbxprojPaths = (0, _Paths().getAllPBXProjectPaths)(projectRoot);
  for (const pbxprojPath of pbxprojPaths) {
    let project = _xcode().default.project(pbxprojPath);
    project.parseSync();
    project = updateDevelopmentTeamForPbxproj(project, appleTeamId);
    _nodeFs().default.writeFileSync(pbxprojPath, project.writeSync());
  }
}
//# sourceMappingURL=DevelopmentTeam.js.map