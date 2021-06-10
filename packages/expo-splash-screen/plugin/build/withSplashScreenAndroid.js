"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashScreenAsync = exports.getSplashScreenConfig = exports.withSplashScreenAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const configure_splash_screen_1 = require("@expo/configure-splash-screen");
exports.withSplashScreenAndroid = config => {
    var _a, _b;
    // Update the android status bar to match the splash screen
    // androidStatusBar applies info to the app activity style.
    const backgroundColor = getSplashBackgroundColor(config);
    if ((_a = config.androidStatusBar) === null || _a === void 0 ? void 0 : _a.backgroundColor) {
        if (backgroundColor.toLowerCase() !== ((_b = config.androidStatusBar) === null || _b === void 0 ? void 0 : _b.backgroundColor.toLowerCase())) {
            config_plugins_1.WarningAggregator.addWarningAndroid('androidStatusBar.backgroundColor', 'The androidStatusBar.backgroundColor color conflicts with the splash backgroundColor on Android');
        }
    }
    else {
        if (!config.androidStatusBar)
            config.androidStatusBar = {};
        config.androidStatusBar.backgroundColor = backgroundColor;
    }
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setSplashScreenAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
function getSplashBackgroundColor(config) {
    var _a, _b, _c, _d, _e;
    const backgroundColor = (_e = (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.splash) === null || _b === void 0 ? void 0 : _b.backgroundColor) !== null && _c !== void 0 ? _c : (_d = config.splash) === null || _d === void 0 ? void 0 : _d.backgroundColor) !== null && _e !== void 0 ? _e : '#FFFFFF'; // white
    return backgroundColor;
}
function getSplashScreenConfig(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    if (!config.splash && !((_a = config.android) === null || _a === void 0 ? void 0 : _a.splash)) {
        return;
    }
    const backgroundColor = getSplashBackgroundColor(config);
    const result = {
        imageResizeMode: (_f = (_d = (_c = (_b = config.android) === null || _b === void 0 ? void 0 : _b.splash) === null || _c === void 0 ? void 0 : _c.resizeMode) !== null && _d !== void 0 ? _d : (_e = config.splash) === null || _e === void 0 ? void 0 : _e.resizeMode) !== null && _f !== void 0 ? _f : configure_splash_screen_1.SplashScreenImageResizeMode.CONTAIN,
        backgroundColor,
        image: (_w = (_t = (_q = (_m = (_j = (_h = (_g = config.android) === null || _g === void 0 ? void 0 : _g.splash) === null || _h === void 0 ? void 0 : _h.xxxhdpi) !== null && _j !== void 0 ? _j : (_l = (_k = config.android) === null || _k === void 0 ? void 0 : _k.splash) === null || _l === void 0 ? void 0 : _l.xxhdpi) !== null && _m !== void 0 ? _m : (_p = (_o = config.android) === null || _o === void 0 ? void 0 : _o.splash) === null || _p === void 0 ? void 0 : _p.xhdpi) !== null && _q !== void 0 ? _q : (_s = (_r = config.android) === null || _r === void 0 ? void 0 : _r.splash) === null || _s === void 0 ? void 0 : _s.hdpi) !== null && _t !== void 0 ? _t : (_v = (_u = config.android) === null || _u === void 0 ? void 0 : _u.splash) === null || _v === void 0 ? void 0 : _v.mdpi) !== null && _w !== void 0 ? _w : (_x = config.splash) === null || _x === void 0 ? void 0 : _x.image,
        statusBar: {
            backgroundColor,
            // Use the settings from androidStatusBar to keep the transition as smooth as possible.
            hidden: (_y = config.androidStatusBar) === null || _y === void 0 ? void 0 : _y.hidden,
            translucent: (_z = config.androidStatusBar) === null || _z === void 0 ? void 0 : _z.translucent,
            style: (_0 = config.androidStatusBar) === null || _0 === void 0 ? void 0 : _0.barStyle,
        },
    };
    return result;
}
exports.getSplashScreenConfig = getSplashScreenConfig;
async function setSplashScreenAsync(config, projectRoot) {
    const splashConfig = getSplashScreenConfig(config);
    if (!splashConfig) {
        return;
    }
    try {
        await configure_splash_screen_1.configureAndroidSplashScreen(projectRoot, splashConfig);
    }
    catch (e) {
        // TODO: Throw errors in EXPO_DEBUG
        config_plugins_1.WarningAggregator.addWarningAndroid('splash', e);
    }
}
exports.setSplashScreenAsync = setSplashScreenAsync;
