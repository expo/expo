"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applySplashScreenStoryboard = applySplashScreenStoryboard;
exports.withIosSplashScreenImage = void 0;

function _InterfaceBuilder() {
  const data = require("./InterfaceBuilder");

  _InterfaceBuilder = function () {
    return data;
  };

  return data;
}

function _withIosSplashScreenStoryboard() {
  const data = require("./withIosSplashScreenStoryboard");

  _withIosSplashScreenStoryboard = function () {
    return data;
  };

  return data;
}

const withIosSplashScreenImage = (config, splash) => {
  return (0, _withIosSplashScreenStoryboard().withIosSplashScreenStoryboard)(config, config => {
    config.modResults = applySplashScreenStoryboard(config.modResults, splash);
    return config;
  });
};

exports.withIosSplashScreenImage = withIosSplashScreenImage;

function applySplashScreenStoryboard(obj, splash) {
  const resizeMode = splash === null || splash === void 0 ? void 0 : splash.resizeMode;
  const splashScreenImagePresent = Boolean(splash === null || splash === void 0 ? void 0 : splash.image);
  const imageName = 'SplashScreen'; // Only get the resize mode when the image is present.

  if (splashScreenImagePresent) {
    const contentMode = getImageContentMode(resizeMode || 'contain');
    return (0, _InterfaceBuilder().applyImageToSplashScreenXML)(obj, {
      contentMode,
      imageName
    });
  }

  return (0, _InterfaceBuilder().removeImageFromSplashScreen)(obj, {
    imageName
  });
}

function getImageContentMode(resizeMode) {
  switch (resizeMode) {
    case 'contain':
      return 'scaleAspectFit';

    case 'cover':
      return 'scaleAspectFill';

    default:
      throw new Error(`{ resizeMode: "${resizeMode}" } is not supported for iOS platform.`);
  }
}
//# sourceMappingURL=wtihIosSplashScreenStoryboardImage.js.map