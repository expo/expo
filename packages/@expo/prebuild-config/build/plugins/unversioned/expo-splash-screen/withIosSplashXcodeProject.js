"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashStoryboardAsync = exports.withIosSplashXcodeProject = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const path_1 = __importDefault(require("path"));
const withIosSplashScreenStoryboard_1 = require("./withIosSplashScreenStoryboard");
const debug = require('debug')('expo:prebuild-config:expo-splash-screen:ios:xcodeproj');
const withIosSplashXcodeProject = (config) => {
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        config.modResults = await setSplashStoryboardAsync({
            projectName: config.modRequest.projectName,
            project: config.modResults,
        });
        return config;
    });
};
exports.withIosSplashXcodeProject = withIosSplashXcodeProject;
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
async function setSplashStoryboardAsync({ projectName, project, }) {
    // Check if `${projectName}/SplashScreen.storyboard` already exists
    // Path relative to `ios` directory
    const storyboardFilePath = path_1.default.join(projectName, withIosSplashScreenStoryboard_1.STORYBOARD_FILE_PATH);
    if (!project.hasFile(storyboardFilePath)) {
        debug(`Adding ${storyboardFilePath} to Xcode project`);
        config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
            filepath: storyboardFilePath,
            groupName: projectName,
            project,
        });
    }
    return project;
}
exports.setSplashStoryboardAsync = setSplashStoryboardAsync;
