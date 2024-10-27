import ExpoFontLoader from './ExpoFontLoader';

export const loadPromises: { [name: string]: Promise<void> } = {};

// cache the value on the js side for fast access to the fonts that are loaded
let cache: { [name: string]: boolean } = {};

export function markLoaded(fontFamily: string) {
  cache[fontFamily] = true;
}

export function isLoadedInCache(fontFamily: string): boolean {
  return fontFamily in cache;
}

export function isLoadedNative(fontFamily: string): boolean {
  if (isLoadedInCache(fontFamily)) {
    return true;
  } else {
    const loadedNativeFonts: string[] = ExpoFontLoader.getLoadedFonts();
    loadedNativeFonts.forEach((font) => {
      cache[font] = true;
    });
    return fontFamily in cache;
  }
}

export function purgeFontFamilyFromCache(fontFamily: string): void {
  delete cache[fontFamily];
}

export function purgeCache(): void {
  cache = {};
}
