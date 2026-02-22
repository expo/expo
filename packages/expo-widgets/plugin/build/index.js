"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withAppGroupEntitlements_1 = __importDefault(require("./withAppGroupEntitlements"));
const withAppInfoPlist_1 = __importDefault(require("./withAppInfoPlist"));
const withEasConfig_1 = __importDefault(require("./withEasConfig"));
const withIosWarning_1 = __importDefault(require("./withIosWarning"));
const withPodsLinking_1 = __importDefault(require("./withPodsLinking"));
const withPushNotifications_1 = __importDefault(require("./withPushNotifications"));
const withWidgetSourceFiles_1 = __importDefault(require("./withWidgetSourceFiles"));
const withTargetXcodeProject_1 = __importDefault(require("./xcode/withTargetXcodeProject"));
const pkg = require('expo-widgets/package.json');
const withWidgets = (config, props) => {
    let plugins = [];
    const deploymentTarget = '16.2';
    const targetName = 'ExpoWidgetsTarget';
    let bundleIdentifier = props.bundleIdentifier;
    if (!bundleIdentifier) {
        bundleIdentifier = `${config.ios?.bundleIdentifier}.${targetName}`;
        plugins.push([
            withIosWarning_1.default,
            {
                property: 'bundleIdentifier',
                warning: `Expo Widgets: No bundle identifier provided, using fallback: ${bundleIdentifier}.`,
            },
        ]);
    }
    let groupIdentifier = props.groupIdentifier;
    if (!groupIdentifier) {
        if (!config.ios?.bundleIdentifier) {
            throw new Error('iOS bundle identifier is required. Please set `ios.bundleIdentifier` in `app.json` or `app.config.js`');
        }
        groupIdentifier = `group.${config.ios.bundleIdentifier}`;
        plugins.push([
            withIosWarning_1.default,
            {
                property: 'groupIdentifier',
                warning: `Expo Widgets: No group identifier provided, using fallback: ${groupIdentifier}.`,
            },
        ]);
    }
    const widgets = props.widgets ?? [];
    const enablePushNotifications = props.enablePushNotifications ?? false;
    const frequentUpdates = props.frequentUpdates ?? false;
    let sharedFiles = [];
    const setFiles = (files) => {
        sharedFiles = [...sharedFiles, ...files];
    };
    const getFileUris = () => sharedFiles;
    plugins = [
        ...plugins,
        [withEasConfig_1.default, { targetName, bundleIdentifier, groupIdentifier }],
        [withPodsLinking_1.default, { targetName }],
        [withWidgetSourceFiles_1.default, { targetName, widgets, groupIdentifier, onFilesGenerated: setFiles }],
        [withAppInfoPlist_1.default, { frequentUpdates, groupIdentifier }],
        [withPushNotifications_1.default, { enablePushNotifications }],
        [withAppGroupEntitlements_1.default, { groupIdentifier }],
        [
            withTargetXcodeProject_1.default,
            {
                targetName,
                bundleIdentifier,
                deploymentTarget,
                appleTeamId: config.ios?.appleTeamId,
                getFileUris,
            },
        ],
    ];
    return (0, config_plugins_1.withPlugins)(config, plugins);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withWidgets, pkg.name, pkg.version);
