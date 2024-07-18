import ExpoFontLoader from './ExpoFontLoader';
export const loadPromises = {};
// cache the value on the js side for fast access to the fonts that are loaded
const _cache = {};
export const markLoaded = (fontFamily) => {
    _cache[fontFamily] = true;
};
export const isLoadedInCache = (fontFamily) => {
    return fontFamily in _cache;
};
export const isLoadedNative = (fontFamily) => {
    if (isLoadedInCache(fontFamily)) {
        return true;
    }
    else {
        const loadedNativeFonts = ExpoFontLoader.loadedFonts;
        loadedNativeFonts.forEach((font) => {
            _cache[font] = true;
        });
        return fontFamily in _cache;
    }
};
export const purgeCache = (fontFamily) => {
    const keysToPurge = fontFamily ? [fontFamily] : Object.keys(_cache);
    for (const fontFamily of keysToPurge) {
        delete _cache[fontFamily];
    }
};
//# sourceMappingURL=memory.js.map