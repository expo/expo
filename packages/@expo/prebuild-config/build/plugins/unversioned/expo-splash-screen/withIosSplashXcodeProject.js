"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSplashStoryboardAsync = setSplashStoryboardAsync;
exports.withIosSplashXcodeProject = void 0;

function _configPlugins() {
  const data = require("@expo/config-plugins");

  _configPlugins = function () {
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

function _withIosSplashScreenStoryboard() {
  const data = require("./withIosSplashScreenStoryboard");

  _withIosSplashScreenStoryboard = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = require('debug')('expo:prebuild-config:expo-splash-screen:ios:xcodeproj');

const withIosSplashXcodeProject = config => {
  return (0, _configPlugins().withXcodeProject)(config, async config => {
    config.modResults = await setSplashStoryboardAsync({
      projectName: config.modRequest.projectName,
      project: config.modResults
    });
    return config;
  });
};
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */


exports.withIosSplashXcodeProject = withIosSplashXcodeProject;

async function setSplashStoryboardAsync({
  projectName,
  project
}) {
  // Check if `${projectName}/SplashScreen.storyboard` already exists
  // Path relative to `ios` directory
  const storyboardFilePath = _path().default.join(projectName, _withIosSplashScreenStoryboard().STORYBOARD_FILE_PATH);

  if (!project.hasFile(storyboardFilePath)) {
    debug(`Adding ${storyboardFilePath} to Xcode project`);

    _configPlugins().IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: storyboardFilePath,
      groupName: projectName,
      project
    });
  }

  return project;
}
//# sourceMappingURL=withIosSplashXcodeProject.js.map