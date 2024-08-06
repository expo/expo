import ExpoFontLoader from './ExpoFontLoader';

export const loadPromises: { [name: string]: Promise<void> } = {};

// cache the value on the js side for fast access to the fonts that are loaded
let _cache: { [name: string]: boolean } = {};

export function markLoaded(fontFamily: string) {
  _cache[fontFamily] = true;
};

export const isLoadedInCache = (fontFamily: string) => {
  return fontFamily in _cache;
};

export const isLoadedNative = (fontFamily: string) => {
  if (isLoadedInCache(fontFamily)) {
    return true;
  } else {
    const loadedNativeFonts: string[] = ExpoFontLoader.loadedFonts;
    loadedNativeFonts.forEach((font) => {
      _cache[font] = true;
    });
    return fontFamily in _cache;
  }
};

export const purgeFontFamilyFromCache = (fontFamily: string) => {
  delete _cache[fontFamily];
};
export const purgeCache = () => {
  _cache = {};
};
