"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIosSplashConfig = getIosSplashConfig;
const defaultResizeMode = 'contain';
const defaultBackgroundColor = '#ffffff';
// TODO: Maybe use an array on splash with theme value. Then remove the array in serialization for legacy and manifest.
function getIosSplashConfig(config) {
  var _config$ios;
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except iOS.
  if ((_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.splash) {
    var _config$ios2, _splash$image, _splash$resizeMode, _splash$backgroundCol, _splash$fadeTime, _splash$tabletImage, _splash$dark$image, _splash$dark, _splash$dark2, _splash$dark$tabletIm, _splash$dark3, _splash$dark4;
    const splash = (_config$ios2 = config.ios) === null || _config$ios2 === void 0 ? void 0 : _config$ios2.splash;
    const image = (_splash$image = splash.image) !== null && _splash$image !== void 0 ? _splash$image : null;
    return {
      image,
      resizeMode: (_splash$resizeMode = splash.resizeMode) !== null && _splash$resizeMode !== void 0 ? _splash$resizeMode : defaultResizeMode,
      backgroundColor: (_splash$backgroundCol = splash.backgroundColor) !== null && _splash$backgroundCol !== void 0 ? _splash$backgroundCol : defaultBackgroundColor,
      fadeTime: (_splash$fadeTime = splash['fadeTime']) !== null && _splash$fadeTime !== void 0 ? _splash$fadeTime : 0,
      tabletImage: (_splash$tabletImage = splash.tabletImage) !== null && _splash$tabletImage !== void 0 ? _splash$tabletImage : null,
      tabletBackgroundColor: splash.tabletBackgroundColor,
      dark: {
        image: (_splash$dark$image = (_splash$dark = splash.dark) === null || _splash$dark === void 0 ? void 0 : _splash$dark.image) !== null && _splash$dark$image !== void 0 ? _splash$dark$image : null,
        backgroundColor: (_splash$dark2 = splash.dark) === null || _splash$dark2 === void 0 ? void 0 : _splash$dark2.backgroundColor,
        tabletImage: (_splash$dark$tabletIm = (_splash$dark3 = splash.dark) === null || _splash$dark3 === void 0 ? void 0 : _splash$dark3.tabletImage) !== null && _splash$dark$tabletIm !== void 0 ? _splash$dark$tabletIm : null,
        tabletBackgroundColor: (_splash$dark4 = splash.dark) === null || _splash$dark4 === void 0 ? void 0 : _splash$dark4.tabletBackgroundColor
      }
    };
  }
  if (config.splash) {
    var _splash$image2, _splash$resizeMode2, _splash$backgroundCol2, _splash$fadeTime2;
    const splash = config.splash;
    const image = (_splash$image2 = splash.image) !== null && _splash$image2 !== void 0 ? _splash$image2 : null;
    return {
      image,
      resizeMode: (_splash$resizeMode2 = splash.resizeMode) !== null && _splash$resizeMode2 !== void 0 ? _splash$resizeMode2 : defaultResizeMode,
      backgroundColor: (_splash$backgroundCol2 = splash.backgroundColor) !== null && _splash$backgroundCol2 !== void 0 ? _splash$backgroundCol2 : defaultBackgroundColor,
      fadeTime: (_splash$fadeTime2 = splash['fadeTime']) !== null && _splash$fadeTime2 !== void 0 ? _splash$fadeTime2 : 0,
      tabletImage: null,
      tabletBackgroundColor: null,
      dark: {
        image: null,
        backgroundColor: null,
        tabletImage: null,
        tabletBackgroundColor: null
      }
    };
  }
  return {
    backgroundColor: '#ffffff',
    resizeMode: 'contain',
    fadeTime: 0,
    tabletImage: null,
    tabletBackgroundColor: null
  };
}
//# sourceMappingURL=getIosSplashConfig.js.map