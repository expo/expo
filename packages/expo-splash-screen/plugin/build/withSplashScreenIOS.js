"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashScreenAsync = exports.getSplashScreen = exports.withSplashScreenIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const configure_splash_screen_1 = require("@expo/configure-splash-screen");
exports.withSplashScreenIOS = config => {
    return config_plugins_1.withDangerousMod(config, [
        'ios',
        async (config) => {
            await setSplashScreenAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
function getSplashScreen(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (!config.splash && !((_a = config.ios) === null || _a === void 0 ? void 0 : _a.splash)) {
        return;
    }
    const result = {
        imageResizeMode: (_f = (_d = (_c = (_b = config.ios) === null || _b === void 0 ? void 0 : _b.splash) === null || _c === void 0 ? void 0 : _c.resizeMode) !== null && _d !== void 0 ? _d : (_e = config.splash) === null || _e === void 0 ? void 0 : _e.resizeMode) !== null && _f !== void 0 ? _f : configure_splash_screen_1.SplashScreenImageResizeMode.CONTAIN,
        backgroundColor: (_l = (_j = (_h = (_g = config.ios) === null || _g === void 0 ? void 0 : _g.splash) === null || _h === void 0 ? void 0 : _h.backgroundColor) !== null && _j !== void 0 ? _j : (_k = config.splash) === null || _k === void 0 ? void 0 : _k.backgroundColor) !== null && _l !== void 0 ? _l : '#FFFFFF',
        image: (_p = (_o = (_m = config.ios) === null || _m === void 0 ? void 0 : _m.splash) === null || _o === void 0 ? void 0 : _o.image) !== null && _p !== void 0 ? _p : (_q = config.splash) === null || _q === void 0 ? void 0 : _q.image,
    };
    return result;
}
exports.getSplashScreen = getSplashScreen;
async function setSplashScreenAsync(config, projectRoot) {
    const splashConfig = getSplashScreen(config);
    if (!splashConfig) {
        return;
    }
    try {
        await configure_splash_screen_1.configureIosSplashScreen(projectRoot, splashConfig);
    }
    catch (e) {
        // TODO: Throw errors in EXPO_DEBUG
        config_plugins_1.WarningAggregator.addWarningIOS('splash', e);
    }
}
exports.setSplashScreenAsync = setSplashScreenAsync;
