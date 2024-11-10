"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIosSplashConfig = getIosSplashConfig;
const defaultResizeMode = 'contain';
const defaultBackgroundColor = '#ffffff';
// TODO: Maybe use an array on splash with theme value. Then remove the array in serialization for legacy and manifest.
function getIosSplashConfig(config, props) {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except iOS.

  // We are using the config plugin
  if (props) {
    const splash = props;
    return {
      image: splash.image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
      tabletImage: splash.tabletImage,
      tabletBackgroundColor: splash.tabletBackgroundColor,
      enableFullScreenImage_legacy: splash.enableFullScreenImage_legacy,
      dark: {
        image: splash.dark?.image,
        backgroundColor: splash.dark?.backgroundColor,
        tabletImage: splash.dark?.tabletImage,
        tabletBackgroundColor: splash.dark?.tabletBackgroundColor
      },
      imageWidth: splash.imageWidth
    };
  }
  if (config.ios?.splash) {
    const splash = config.ios?.splash;
    const image = splash.image;
    return {
      image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
      tabletImage: splash.tabletImage,
      tabletBackgroundColor: splash.tabletBackgroundColor,
      enableFullScreenImage_legacy: true,
      dark: {
        image: splash.dark?.image,
        backgroundColor: splash.dark?.backgroundColor,
        tabletImage: splash.dark?.tabletImage,
        tabletBackgroundColor: splash.dark?.tabletBackgroundColor
      },
      imageWidth: 200
    };
  }
  if (config.splash) {
    const splash = config.splash;
    const image = splash.image;
    return {
      image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      backgroundColor: splash.backgroundColor ?? defaultBackgroundColor,
      enableFullScreenImage_legacy: true,
      imageWidth: 200
    };
  }
  return {
    backgroundColor: '#ffffff',
    resizeMode: 'contain',
    enableFullScreenImage_legacy: true,
    imageWidth: 200
  };
}
//# sourceMappingURL=getIosSplashConfig.js.map