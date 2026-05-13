"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSplashScreenImage = void 0;
exports.applySplashScreenStoryboard = applySplashScreenStoryboard;
const InterfaceBuilder_1 = require("./InterfaceBuilder");
const withIosSplashScreenStoryboard_1 = require("./withIosSplashScreenStoryboard");
const withIosSplashScreenImage = (config, splash) => {
    return (0, withIosSplashScreenStoryboard_1.withIosSplashScreenStoryboard)(config, (config) => {
        config.modResults = applySplashScreenStoryboard(config.modResults, splash);
        return config;
    });
};
exports.withIosSplashScreenImage = withIosSplashScreenImage;
function applySplashScreenStoryboard(obj, splash) {
    const { resizeMode } = splash;
    const splashScreenImagePresent = Boolean(splash.image);
    const imageName = splash.enableFullScreenImage_legacy ? 'SplashScreenLegacy' : 'SplashScreenLogo';
    // Only get the resize mode when the image is present.
    if (splashScreenImagePresent) {
        const contentMode = getImageContentMode(resizeMode || 'contain');
        return (0, InterfaceBuilder_1.applyImageToSplashScreenXML)(obj, {
            contentMode,
            imageName,
            backgroundColor: splash.backgroundColor,
            enableFullScreenImage: splash.enableFullScreenImage_legacy ?? false,
            imageWidth: splash.imageWidth,
        });
    }
    return (0, InterfaceBuilder_1.removeImageFromSplashScreen)(obj, { imageName });
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
