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