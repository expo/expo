import ExpoFontLoader from './ExpoFontLoader';
export const loadPromises = {};
// cache the value on the js side for fast access to the fonts that are loaded
let cache = {};
export function markLoaded(fontFamily) {
    cache[fontFamily] = true;
}
export function isLoadedInCache(fontFamily) {
    return fontFamily in cache;
}
export function isLoadedNative(fontFamily) {
    if (isLoadedInCache(fontFamily)) {
        return true;
    }
    else {
        const loadedNativeFonts = ExpoFontLoader.getLoadedFonts();
        // NOTE(brentvatne): Bail out here if there are no loaded fonts. This
        // is functionally equivalent to the behavior below if the returned array
        // is empty, but this handles improper mocking of `getLoadedFonts`.
        if (!loadedNativeFonts?.length) {
            return false;
        }
        loadedNativeFonts.forEach((font) => {
            cache[font] = true;
        });
        return fontFamily in cache;
    }
}
export function purgeFontFamilyFromCache(fontFamily) {
    delete cache[fontFamily];
}
export function purgeCache() {
    cache = {};
}
//# sourceMappingURL=memory.js.map