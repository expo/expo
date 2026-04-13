"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosSplashConfig = getIosSplashConfig;
// TODO: Maybe use an array on splash with theme value. Then remove the array in serialization for legacy and manifest.
function getIosSplashConfig({ ios = {}, ...rest }) {
    // Respect the splash screen object, don't mix and match across different splash screen objects
    // in case the user wants the top level splash to apply to every platform except iOS.
    const { dark, ...root } = { ...rest, ...ios, dark: { ...rest.dark, ...ios.dark } };
    return {
        enableFullScreenImage_legacy: root.enableFullScreenImage_legacy ?? false,
        imageWidth: root.imageWidth ?? 100,
        resizeMode: (root.resizeMode !== 'native' ? root.resizeMode : undefined) ?? 'contain',
        backgroundColor: root.backgroundColor ?? '#ffffff',
        image: root.image,
        tabletBackgroundColor: root.tabletBackgroundColor,
        tabletImage: root.tabletImage,
        dark: {
            backgroundColor: dark.backgroundColor,
            image: dark.image,
            tabletBackgroundColor: dark.tabletBackgroundColor,
            tabletImage: dark.tabletImage,
        },
    };
}
