"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAndroidDarkSplashConfig = getAndroidDarkSplashConfig;
exports.getAndroidSplashConfig = getAndroidSplashConfig;
const defaultResizeMode = 'contain';
function getAndroidSplashConfig(config, props) {
  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if (props) {
    const splash = props;
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      backgroundColor: splash.backgroundColor,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      image: splash.image,
      imageWidth: splash.imageWidth ?? 100,
      dark: splash.dark,
      drawable: splash.drawable
    };
  }
  if (config.android?.splash) {
    const splash = config.android?.splash;
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      backgroundColor: splash.backgroundColor,
      image: splash.image,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      imageWidth: 200,
      dark: splash.dark
    };
  }
  if (config.splash) {
    const splash = config.splash;
    return {
      xxxhdpi: splash.image,
      xxhdpi: splash.image,
      xhdpi: splash.image,
      hdpi: splash.image,
      mdpi: splash.image,
      image: splash.image,
      backgroundColor: splash.backgroundColor,
      resizeMode: splash.resizeMode ?? defaultResizeMode,
      imageWidth: 200,
      dark: splash.dark
    };
  }
  return null;
}
function getAndroidDarkSplashConfig(config, props) {
  if (props?.dark) {
    const splash = props.dark;
    const lightTheme = getAndroidSplashConfig(config, props);
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      image: splash.image,
      backgroundColor: splash.backgroundColor,
      resizeMode: lightTheme?.resizeMode ?? defaultResizeMode,
      drawable: props.drawable
    };
  }

  // Respect the splash screen object, don't mix and match across different splash screen objects
  // in case the user wants the top level splash to apply to every platform except android.
  if (config.android?.splash?.dark) {
    const splash = config.android?.splash?.dark;
    const lightTheme = getAndroidSplashConfig(config, props);
    return {
      xxxhdpi: splash.xxxhdpi ?? splash.image,
      xxhdpi: splash.xxhdpi ?? splash.image,
      xhdpi: splash.xhdpi ?? splash.image,
      hdpi: splash.hdpi ?? splash.image,
      mdpi: splash.mdpi ?? splash.image,
      image: splash.image,
      backgroundColor: splash.backgroundColor,
      // Can't support dark resizeMode because the resize mode is hardcoded into the MainActivity.java
      resizeMode: lightTheme?.resizeMode ?? defaultResizeMode
    };
  }
  return null;
}
//# sourceMappingURL=getAndroidSplashConfig.js.map