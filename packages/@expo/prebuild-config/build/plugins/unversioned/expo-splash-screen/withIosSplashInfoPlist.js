"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashInfoPlist = exports.withIosSplashInfoPlist = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('expo:prebuild-config:expo-splash-screen:ios:infoPlist');
const withIosSplashInfoPlist = (config, splash) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setSplashInfoPlist(config, config.modResults, splash);
        return config;
    });
};
exports.withIosSplashInfoPlist = withIosSplashInfoPlist;
function setSplashInfoPlist(config, infoPlist, splash) {
    const isDarkModeEnabled = !!(splash?.dark?.image ||
        splash?.dark?.tabletImage ||
        splash?.dark?.backgroundColor ||
        splash?.dark?.tabletBackgroundColor);
    debug(`isDarkModeEnabled: `, isDarkModeEnabled);
    if (isDarkModeEnabled) {
        // IOSConfig.UserInterfaceStyle.getUserInterfaceStyle(config);
        // Determine if the user manually defined the userInterfaceStyle incorrectly
        const existing = config.ios?.userInterfaceStyle ?? config.userInterfaceStyle;
        // Add a warning to prevent the dark mode splash screen from not being shown -- this was learned the hard way.
        if (existing && existing !== 'automatic') {
            config_plugins_1.WarningAggregator.addWarningIOS('userInterfaceStyle', 'The existing `userInterfaceStyle` property is preventing splash screen from working properly. Please remove it or disable dark mode splash screens.');
        }
        // assigning it to auto anyways, but this is fragile because the order of operations matter now
        infoPlist.UIUserInterfaceStyle = 'Automatic';
    }
    else {
        // NOTE(brentvatne): Commented out this line because it causes https://github.com/expo/expo-cli/issues/3935
        // We should revisit this approach.
        // delete infoPlist.UIUserInterfaceStyle;
    }
    if (splash) {
        // TODO: What to do here ??
        infoPlist.UILaunchStoryboardName = 'SplashScreen';
    }
    else {
        debug(`Disabling UILaunchStoryboardName`);
        delete infoPlist.UILaunchStoryboardName;
    }
    return infoPlist;
}
exports.setSplashInfoPlist = setSplashInfoPlist;
