"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAppGroupEntitlements_1 = __importDefault(require("./withAppGroupEntitlements"));
const withAppInfoPlist_1 = __importDefault(require("./withAppInfoPlist"));
const withPodsLinking_1 = __importDefault(require("./withPodsLinking"));
const withPushNotifications_1 = __importDefault(require("./withPushNotifications"));
const withWidgetSourceFiles_1 = __importDefault(require("./withWidgetSourceFiles"));
const withTargetXcodeProject_1 = __importDefault(require("./xcode/withTargetXcodeProject"));
const pkg = require('expo-widgets/package.json');
const withWidgets = (config, { groupIdentifier, enablePushNotifications, widgets }) => {
    if (!groupIdentifier) {
        throw new Error('App Group Identifier is required to configure widgets. Please provide a valid groupIdentifier.');
    }
    if (!widgets) {
        throw new Error('Widget names are required to configure widgets. Please provide at least one widget name.');
    }
    if (!config.ios?.bundleIdentifier) {
        throw new Error('iOS bundle identifier is required to configure widgets. Please set ios.bundleIdentifier in app.json or app.config.js');
    }
    const deploymentTarget = '16.2';
    const targetName = 'ExpoWidgetsTarget';
    const targetBundleIdentifier = `${config.ios.bundleIdentifier}.${targetName}`;
    // It is disabled by default because it may impact battery life
    const frequentUpdates = false;
    let sharedFiles = [];
    const setFiles = (files) => {
        sharedFiles = [...sharedFiles, ...files];
    };
    const getFiles = () => sharedFiles;
    return (0, config_plugins_1.withPlugins)(config, [
        [withPodsLinking_1.default, { targetName }],
        [
            withWidgetSourceFiles_1.default,
            {
                targetName,
                widgets,
                groupIdentifier,
                onFilesGenerated: setFiles,
            },
        ],
        [withAppInfoPlist_1.default, { frequentUpdates, groupIdentifier }],
        [withPushNotifications_1.default, { enablePushNotifications: enablePushNotifications ?? false }],
        [withAppGroupEntitlements_1.default, { targetName, targetBundleIdentifier, groupIdentifier }],
        [
            withTargetXcodeProject_1.default,
            {
                targetName,
                targetBundleIdentifier,
                deploymentTarget,
                getFileUris: getFiles,
            },
        ],
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withWidgets, pkg.name, pkg.version);
