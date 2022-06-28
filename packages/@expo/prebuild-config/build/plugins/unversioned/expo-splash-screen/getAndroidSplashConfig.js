"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAndroidDarkSplashConfig = getAndroidDarkSplashConfig;
exports.getAndroidSplashConfig = getAndroidSplashConfig;
const defaultResizeMode = 'contain';

function getAndroidSplashConfig(config) {
  var _config$android;

  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if ((_config$android = config.android) !== null && _config$android !== void 0 && _config$android.splash) {
    var _config$android2, _ref, _splash$xxxhdpi, _ref2, _splash$xxhdpi, _ref3, _splash$xhdpi, _ref4, _splash$hdpi, _ref5, _splash$mdpi, _splash$backgroundCol, _splash$resizeMode;

    const splash = (_config$android2 = config.android) === null || _config$android2 === void 0 ? void 0 : _config$android2.splash;
    return {
      xxxhdpi: (_ref = (_splash$xxxhdpi = splash.xxxhdpi) !== null && _splash$xxxhdpi !== void 0 ? _splash$xxxhdpi : splash.image) !== null && _ref !== void 0 ? _ref : null,
      xxhdpi: (_ref2 = (_splash$xxhdpi = splash.xxhdpi) !== null && _splash$xxhdpi !== void 0 ? _splash$xxhdpi : splash.image) !== null && _ref2 !== void 0 ? _ref2 : null,
      xhdpi: (_ref3 = (_splash$xhdpi = splash.xhdpi) !== null && _splash$xhdpi !== void 0 ? _splash$xhdpi : splash.image) !== null && _ref3 !== void 0 ? _ref3 : null,
      hdpi: (_ref4 = (_splash$hdpi = splash.hdpi) !== null && _splash$hdpi !== void 0 ? _splash$hdpi : splash.image) !== null && _ref4 !== void 0 ? _ref4 : null,
      mdpi: (_ref5 = (_splash$mdpi = splash.mdpi) !== null && _splash$mdpi !== void 0 ? _splash$mdpi : splash.image) !== null && _ref5 !== void 0 ? _ref5 : null,
      backgroundColor: (_splash$backgroundCol = splash.backgroundColor) !== null && _splash$backgroundCol !== void 0 ? _splash$backgroundCol : null,
      resizeMode: (_splash$resizeMode = splash.resizeMode) !== null && _splash$resizeMode !== void 0 ? _splash$resizeMode : defaultResizeMode
    };
  }

  if (config.splash) {
    var _splash$image, _splash$image2, _splash$image3, _splash$image4, _splash$image5, _splash$backgroundCol2, _splash$resizeMode2;

    const splash = config.splash;
    return {
      xxxhdpi: (_splash$image = splash.image) !== null && _splash$image !== void 0 ? _splash$image : null,
      xxhdpi: (_splash$image2 = splash.image) !== null && _splash$image2 !== void 0 ? _splash$image2 : null,
      xhdpi: (_splash$image3 = splash.image) !== null && _splash$image3 !== void 0 ? _splash$image3 : null,
      hdpi: (_splash$image4 = splash.image) !== null && _splash$image4 !== void 0 ? _splash$image4 : null,
      mdpi: (_splash$image5 = splash.image) !== null && _splash$image5 !== void 0 ? _splash$image5 : null,
      backgroundColor: (_splash$backgroundCol2 = splash.backgroundColor) !== null && _splash$backgroundCol2 !== void 0 ? _splash$backgroundCol2 : null,
      resizeMode: (_splash$resizeMode2 = splash.resizeMode) !== null && _splash$resizeMode2 !== void 0 ? _splash$resizeMode2 : defaultResizeMode
    };
  }

  return null;
} // TODO: dark isn't supported in the Expo config spec yet.


function getAndroidDarkSplashConfig(config) {
  var _config$android3, _config$android3$spla;

  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if ((_config$android3 = config.android) !== null && _config$android3 !== void 0 && (_config$android3$spla = _config$android3.splash) !== null && _config$android3$spla !== void 0 && _config$android3$spla.dark) {
    var _config$android4, _config$android4$spla, _ref6, _splash$xxxhdpi2, _ref7, _splash$xxhdpi2, _ref8, _splash$xhdpi2, _ref9, _splash$hdpi2, _ref10, _splash$mdpi2, _splash$backgroundCol3, _lightTheme$resizeMod;

    const splash = (_config$android4 = config.android) === null || _config$android4 === void 0 ? void 0 : (_config$android4$spla = _config$android4.splash) === null || _config$android4$spla === void 0 ? void 0 : _config$android4$spla.dark;
    const lightTheme = getAndroidSplashConfig(config);
    return {
      xxxhdpi: (_ref6 = (_splash$xxxhdpi2 = splash.xxxhdpi) !== null && _splash$xxxhdpi2 !== void 0 ? _splash$xxxhdpi2 : splash.image) !== null && _ref6 !== void 0 ? _ref6 : null,
      xxhdpi: (_ref7 = (_splash$xxhdpi2 = splash.xxhdpi) !== null && _splash$xxhdpi2 !== void 0 ? _splash$xxhdpi2 : splash.image) !== null && _ref7 !== void 0 ? _ref7 : null,
      xhdpi: (_ref8 = (_splash$xhdpi2 = splash.xhdpi) !== null && _splash$xhdpi2 !== void 0 ? _splash$xhdpi2 : splash.image) !== null && _ref8 !== void 0 ? _ref8 : null,
      hdpi: (_ref9 = (_splash$hdpi2 = splash.hdpi) !== null && _splash$hdpi2 !== void 0 ? _splash$hdpi2 : splash.image) !== null && _ref9 !== void 0 ? _ref9 : null,
      mdpi: (_ref10 = (_splash$mdpi2 = splash.mdpi) !== null && _splash$mdpi2 !== void 0 ? _splash$mdpi2 : splash.image) !== null && _ref10 !== void 0 ? _ref10 : null,
      backgroundColor: (_splash$backgroundCol3 = splash.backgroundColor) !== null && _splash$backgroundCol3 !== void 0 ? _splash$backgroundCol3 : null,
      // Can't support dark resizeMode because the resize mode is hardcoded into the MainActivity.java
      resizeMode: (_lightTheme$resizeMod = lightTheme === null || lightTheme === void 0 ? void 0 : lightTheme.resizeMode) !== null && _lightTheme$resizeMod !== void 0 ? _lightTheme$resizeMod : defaultResizeMode
    };
  }

  return null;
}
//# sourceMappingURL=getAndroidSplashConfig.js.map