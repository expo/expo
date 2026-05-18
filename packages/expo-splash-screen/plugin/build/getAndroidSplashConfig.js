"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndroidSplashConfig = getAndroidSplashConfig;
function getAndroidSplashConfig({ android = {}, ...rest }) {
    // Respect the splash screen object, don't mix and match across different splash screen objects
    // in case the user wants the top level splash to apply to every platform except android.
    const { dark, ...root } = { ...rest, ...android, dark: { ...rest.dark, ...android.dark } };
    return {
        drawable: root.drawable,
        imageWidth: root.imageWidth ?? 100,
        resizeMode: root.resizeMode ?? 'contain',
        backgroundColor: root.backgroundColor ?? '#ffffff',
        image: root.image,
        mdpi: root.mdpi ?? root.image,
        hdpi: root.hdpi ?? root.image,
        xhdpi: root.xhdpi ?? root.image,
        xxhdpi: root.xxhdpi ?? root.image,
        xxxhdpi: root.xxxhdpi ?? root.image,
        dark: {
            backgroundColor: dark.backgroundColor,
            image: dark.image,
            mdpi: dark.mdpi ?? dark.image,
            hdpi: dark.hdpi ?? dark.image,
            xhdpi: dark.xhdpi ?? dark.image,
            xxhdpi: dark.xxhdpi ?? dark.image,
            xxxhdpi: dark.xxxhdpi ?? dark.image,
        },
    };
}
