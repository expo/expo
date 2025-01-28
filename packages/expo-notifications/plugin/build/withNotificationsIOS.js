"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNotificationSounds = exports.withNotificationsIOS = void 0;
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = require("fs");
const path_1 = require("path");
const ERROR_MSG_PREFIX = 'An error occurred while configuring iOS notifications. ';
const withNotificationsIOS = (config, { mode = 'development', sounds = [], enableBackgroundRemoteNotifications }) => {
    config = (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        if (!config.modResults['aps-environment']) {
            config.modResults['aps-environment'] = mode;
        }
        return config;
    });
    config = withNotificationSounds(config, { sounds });
    config = withBackgroundRemoteNotifications(config, enableBackgroundRemoteNotifications);
    return config;
};
exports.withNotificationsIOS = withNotificationsIOS;
const withBackgroundRemoteNotifications = (config, enableBackgroundRemoteNotifications) => {
    if (!(enableBackgroundRemoteNotifications === undefined ||
        typeof enableBackgroundRemoteNotifications === 'boolean')) {
        throw new Error(ERROR_MSG_PREFIX +
            `"enableBackgroundRemoteNotifications" has an invalid value: ${enableBackgroundRemoteNotifications}. Expected a boolean.`);
    }
    if (!enableBackgroundRemoteNotifications) {
        return config;
    }
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (!Array.isArray(config.modResults.UIBackgroundModes)) {
            config.modResults.UIBackgroundModes = [];
        }
        const notificationBackgroundMode = 'remote-notification';
        if (!config.modResults.UIBackgroundModes.includes(notificationBackgroundMode)) {
            config.modResults.UIBackgroundModes.push(notificationBackgroundMode);
        }
        return config;
    });
};
const withNotificationSounds = (config, { sounds }) => {
    return (0, config_plugins_1.withXcodeProject)(config, (config) => {
        setNotificationSounds(config.modRequest.projectRoot, {
            sounds,
            project: config.modResults,
            projectName: config.modRequest.projectName,
        });
        return config;
    });
};
/**
 * Save sound files to the Xcode project root and add them to the Xcode project.
 */
function setNotificationSounds(projectRoot, { sounds, project, projectName, }) {
    if (!projectName) {
        throw new Error(ERROR_MSG_PREFIX + `Unable to find iOS project name.`);
    }
    if (!Array.isArray(sounds)) {
        throw new Error(ERROR_MSG_PREFIX +
            `Must provide an array of sound files in your app config, found ${typeof sounds}.`);
    }
    const sourceRoot = config_plugins_1.IOSConfig.Paths.getSourceRoot(projectRoot);
    for (const soundFileRelativePath of sounds) {
        const fileName = (0, path_1.basename)(soundFileRelativePath);
        const sourceFilepath = (0, path_1.resolve)(projectRoot, soundFileRelativePath);
        const destinationFilepath = (0, path_1.resolve)(sourceRoot, fileName);
        // Since it's possible that the filename is the same, but the
        // file itself id different, let's copy it regardless
        (0, fs_1.copyFileSync)(sourceFilepath, destinationFilepath);
        if (!project.hasFile(`${projectName}/${fileName}`)) {
            project = config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                filepath: `${projectName}/${fileName}`,
                groupName: projectName,
                isBuildFile: true,
                project,
            });
        }
    }
    return project;
}
exports.setNotificationSounds = setNotificationSounds;
