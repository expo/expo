import ExpoFontLoader from './ExpoFontLoader';
export const loadPromises: { [name: string]: Promise<void> } = {};

// cache the value on the js side for fast access to the fonts that are loaded
const _cache: { [name: string]: boolean } = {};

export const markLoaded = (fontFamily: string) => {
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

export const purgeCache = (fontFamily?: string) => {
  const keysToPurge = fontFamily ? [fontFamily] : Object.keys(_cache);
  for (const fontFamily of keysToPurge) {
    delete _cache[fontFamily];
  }
};
