import ExpoFontLoader from './ExpoFontLoader';
export const loadPromises = {};
// cache the value on the js side for fast access to the fonts that are loaded
let _cache = {};
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
export const purgeFontFamilyFromCache = (fontFamily) => {
    delete _cache[fontFamily];
};
export const purgeCache = () => {
    _cache = {};
};
//# sourceMappingURL=memory.js.map