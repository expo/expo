"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidSplashScreen = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const json_file_1 = __importDefault(require("@expo/json-file"));
const resolve_from_1 = __importDefault(require("resolve-from"));
const semver_1 = __importDefault(require("semver"));
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const withAndroidSplashDrawables_1 = require("./withAndroidSplashDrawables");
const withAndroidSplashImages_1 = require("./withAndroidSplashImages");
const withAndroidSplashLegacyMainActivity_1 = require("./withAndroidSplashLegacyMainActivity");
const withAndroidSplashStrings_1 = require("./withAndroidSplashStrings");
const withAndroidSplashStyles_1 = require("./withAndroidSplashStyles");
const withAndroidSplashScreen = (config) => {
    const splashConfig = (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(config);
    // Update the android status bar to match the splash screen
    // androidStatusBar applies info to the app activity style.
    const backgroundColor = splashConfig?.backgroundColor || '#ffffff';
    if (config.androidStatusBar?.backgroundColor) {
        if (backgroundColor.toLowerCase() !== config.androidStatusBar?.backgroundColor?.toLowerCase?.()) {
            config_plugins_1.WarningAggregator.addWarningAndroid('androidStatusBar.backgroundColor', 'Color conflicts with the splash.backgroundColor');
        }
    }
    else {
        if (!config.androidStatusBar)
            config.androidStatusBar = {};
        config.androidStatusBar.backgroundColor = backgroundColor;
    }
    return (0, config_plugins_1.withPlugins)(config, [
        withAndroidSplashImages_1.withAndroidSplashImages,
        [withAndroidSplashDrawables_1.withAndroidSplashDrawables, splashConfig],
        ...(shouldUpdateLegacyMainActivity(config) ? [withAndroidSplashLegacyMainActivity_1.withAndroidSplashLegacyMainActivity] : []),
        withAndroidSplashStyles_1.withAndroidSplashStyles,
        withAndroidSplashStrings_1.withAndroidSplashStrings,
    ]);
};
exports.withAndroidSplashScreen = withAndroidSplashScreen;
function shouldUpdateLegacyMainActivity(config) {
    try {
        const projectRoot = config._internal?.projectRoot;
        const packagePath = (0, resolve_from_1.default)(projectRoot, 'expo-splash-screen/package.json');
        if (packagePath) {
            const version = json_file_1.default.read(packagePath).version?.toString() ?? '';
            return semver_1.default.lt(version, '0.12.0');
        }
        // If expo-splash-screen didn't be installed or included in template, we check the sdkVersion instead.
        return !!(config.sdkVersion && semver_1.default.lt(config.sdkVersion, '43.0.0'));
    }
    catch { }
    return false;
}
