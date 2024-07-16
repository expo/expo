export const loadPromises: { [name: string]: Promise<void> } = {};

// cache the value on the js side for fast access to the fonts that are loaded
// we do not delete cache entries because font unloading is not a public api
// TODO vonovak use global object cache so that it can be used elsewhere too
// globalThis.expo.modules.ExpoFontLoader.loadedCache ??= {};
const _cache: { [name: string]: boolean } = {};

const getCache = (): { [name: string]: boolean } => {
  return _cache;
};

export const markLoaded = (fontFamily: string) => {
  getCache()[fontFamily] = true;
};

export const isLoadedInCache = (fontFamily: string) => {
  return fontFamily in getCache();
};

export const isLoadedNative = (fontFamily: string) => {
  if (isLoadedInCache(fontFamily)) {
    return true;
  } else {
    const loadedCache = getCache();
    // TODO vonovak mock `loadedFonts` (optional is used only bcs of tests)
    // we're using global instead of the native module - this global is not a public api
    // but is meant to be consumed outside of Expo (community package) if needed
    // @ts-ignore
    const loadedNativeFonts: string[] = global.expo.modules.ExpoFontLoader?.loadedFonts || [];
    loadedNativeFonts.forEach((font) => {
      loadedCache[font] = true;
    });
    return fontFamily in loadedCache;
  }
};

export const purgeCache = (fontFamily?: string) => {
  const loaded = getCache();
  const keysToPurge = fontFamily ? [fontFamily] : Object.keys(loaded);
  for (const fontFamily of keysToPurge) {
    delete loaded[fontFamily];
  }
};
