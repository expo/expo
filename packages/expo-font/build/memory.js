import ExpoFontLoader from './ExpoFontLoader';
export const loadPromises = {};
// cache the value on the js side for fast access to the fonts that are loaded
let cache = {};
export function markLoaded(fontFamily) {
    cache[fontFamily] = true;
}
export const isLoadedInCache = (fontFamily) => {
    return fontFamily in cache;
};
export const isLoadedNative = (fontFamily) => {
    if (isLoadedInCache(fontFamily)) {
        return true;
    }
    else {
        const loadedNativeFonts = ExpoFontLoader.loadedFonts;
        loadedNativeFonts.forEach((font) => {
            cache[font] = true;
        });
        return fontFamily in cache;
    }
};
export const purgeFontFamilyFromCache = (fontFamily) => {
    delete cache[fontFamily];
};
export const purgeCache = () => {
    cache = {};
};
//# sourceMappingURL=memory.js.map