import ExpoFontLoader from './ExpoFontLoader';

export const loadPromises: { [name: string]: Promise<void> } = {};

// cache the value on the js side for fast access to the fonts that are loaded
let cache: { [name: string]: boolean } = {};

export function markLoaded(fontFamily: string) {
  cache[fontFamily] = true;
}

export const isLoadedInCache = (fontFamily: string) => {
  return fontFamily in cache;
};

export const isLoadedNative = (fontFamily: string) => {
  if (isLoadedInCache(fontFamily)) {
    return true;
  } else {
    const loadedNativeFonts: string[] = ExpoFontLoader.loadedFonts;
    loadedNativeFonts.forEach((font) => {
      cache[font] = true;
    });
    return fontFamily in cache;
  }
};

export const purgeFontFamilyFromCache = (fontFamily: string) => {
  delete cache[fontFamily];
};
export const purgeCache = () => {
  cache = {};
};
