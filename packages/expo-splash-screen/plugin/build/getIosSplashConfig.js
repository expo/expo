"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosSplashConfig = getIosSplashConfig;
const defaultResizeMode = 'contain';
const defaultBackgroundColor = '#ffffff';
// TODO: Maybe use an array on splash with theme value. Then remove the array in serialization for legacy and manifest.
function getIosSplashConfig(props) {
    // Respect the splash screen object, don't mix and match across different splash screen objects
    // in case the user wants the top level splash to apply to every platform except iOS.
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
            tabletBackgroundColor: splash.dark?.tabletBackgroundColor,
        },
        imageWidth: splash.imageWidth,
    };
}
