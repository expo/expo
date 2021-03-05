"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashScreenAsync = exports.getSplashScreenConfig = exports.withSplashScreenAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const configure_splash_screen_1 = require("@expo/configure-splash-screen");
exports.withSplashScreenAndroid = config => {
    return config_plugins_1.withDangerousMod(config, [
        'android',
        async (config) => {
            await setSplashScreenAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
function getSplashScreenConfig(config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    if (!config.splash && !((_a = config.android) === null || _a === void 0 ? void 0 : _a.splash)) {
        return;
    }
    const result = {
        imageResizeMode: (_f = (_d = (_c = (_b = config.android) === null || _b === void 0 ? void 0 : _b.splash) === null || _c === void 0 ? void 0 : _c.resizeMode) !== null && _d !== void 0 ? _d : (_e = config.splash) === null || _e === void 0 ? void 0 : _e.resizeMode) !== null && _f !== void 0 ? _f : configure_splash_screen_1.SplashScreenImageResizeMode.CONTAIN,
        backgroundColor: (_l = (_j = (_h = (_g = config.android) === null || _g === void 0 ? void 0 : _g.splash) === null || _h === void 0 ? void 0 : _h.backgroundColor) !== null && _j !== void 0 ? _j : (_k = config.splash) === null || _k === void 0 ? void 0 : _k.backgroundColor) !== null && _l !== void 0 ? _l : '#FFFFFF',
        image: (_1 = (_y = (_v = (_s = (_p = (_o = (_m = config.android) === null || _m === void 0 ? void 0 : _m.splash) === null || _o === void 0 ? void 0 : _o.xxxhdpi) !== null && _p !== void 0 ? _p : (_r = (_q = config.android) === null || _q === void 0 ? void 0 : _q.splash) === null || _r === void 0 ? void 0 : _r.xxhdpi) !== null && _s !== void 0 ? _s : (_u = (_t = config.android) === null || _t === void 0 ? void 0 : _t.splash) === null || _u === void 0 ? void 0 : _u.xhdpi) !== null && _v !== void 0 ? _v : (_x = (_w = config.android) === null || _w === void 0 ? void 0 : _w.splash) === null || _x === void 0 ? void 0 : _x.hdpi) !== null && _y !== void 0 ? _y : (_0 = (_z = config.android) === null || _z === void 0 ? void 0 : _z.splash) === null || _0 === void 0 ? void 0 : _0.mdpi) !== null && _1 !== void 0 ? _1 : (_2 = config.splash) === null || _2 === void 0 ? void 0 : _2.image,
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
