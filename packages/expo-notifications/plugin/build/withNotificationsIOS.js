"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNotificationSounds = exports.withNotificationSounds = exports.withNotificationsIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
exports.withNotificationsIOS = (config, { mode = 'development', sounds = [] }) => {
    config = config_plugins_1.withEntitlementsPlist(config, config => {
        config.modResults['aps-environment'] = mode;
        return config;
    });
    config = exports.withNotificationSounds(config, { sounds });
    return config;
};
exports.withNotificationSounds = (config, { sounds }) => {
    return config_plugins_1.withXcodeProject(config, config => {
        setNotificationSounds(sounds, {
            projectRoot: config.modRequest.projectRoot,
            project: config.modResults,
        });
        return config;
    });
};
/**
 * Save sound files to the Xcode project root and add them to the Xcode project.
 */
function setNotificationSounds(sounds, { projectRoot, project }) {
    if (!Array.isArray(sounds)) {
        throw new Error(`Must provide an array of sound files in your app config, found ${typeof sounds}.`);
    }
    const projectName = config_plugins_1.IOSConfig.XcodeUtils.getProjectName(projectRoot);
    sounds.map((soundFileRelativePath) => {
        const fileName = path_1.default.basename(soundFileRelativePath);
        const sourceFilepath = path_1.default.resolve(projectRoot, soundFileRelativePath);
        const destinationFilepath = path_1.default.join(config_plugins_1.IOSConfig.Paths.getSourceRoot(projectRoot), fileName);
        fs_extra_1.default.copyFileSync(sourceFilepath, destinationFilepath);
        if (!project.hasFile(`${projectName}/${fileName}`)) {
            project = config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
                filepath: `${projectName}/${fileName}`,
                groupName: projectName,
                project: project,
                isBuildFile: true,
            });
        }
    });
    return project;
}
exports.setNotificationSounds = setNotificationSounds;
