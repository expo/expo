"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndroidSplashConfig = getAndroidSplashConfig;
exports.getAndroidDarkSplashConfig = getAndroidDarkSplashConfig;
const defaultResizeMode = 'contain';
function getAndroidSplashConfig(props) {
    // Respect the splash screen object, don't mix and match across different splash screen objects
    // in case the user wants the top level splash to apply to every platform except android.
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
        drawable: splash.drawable,
    };
}
function getAndroidDarkSplashConfig(props) {
    if (props.dark != null) {
        const splash = props.dark;
        const lightTheme = getAndroidSplashConfig(props);
        return {
            xxxhdpi: splash.xxxhdpi ?? splash.image,
            xxhdpi: splash.xxhdpi ?? splash.image,
            xhdpi: splash.xhdpi ?? splash.image,
            hdpi: splash.hdpi ?? splash.image,
            mdpi: splash.mdpi ?? splash.image,
            image: splash.image,
            backgroundColor: splash.backgroundColor,
            resizeMode: lightTheme?.resizeMode ?? defaultResizeMode,
            drawable: props.drawable,
        };
    }
    return null;
}
