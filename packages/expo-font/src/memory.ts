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

export function purgeFontFamilyFromCache(fontFamily: string): void {
  delete cache[fontFamily];
}

export function purgeCache(): void {
  cache = {};
}
