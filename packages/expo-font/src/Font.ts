import { CodedError, Platform, UnavailabilityError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import { FontDisplay, FontResource, FontSource, UnloadFontOptions } from './Font.types';
import { getAssetForSource, loadSingleFontAsync } from './FontLoader';
import { loaded, loadPromises } from './memory';
import { registerStaticFont } from './server';

// @needsAudit
/**
 * Used to transform font family names to the scoped name. This does not need to
 * be called in standalone or bare apps, but it will return unscoped font family
 * names if it is called in those contexts.
 *
 * @param fontFamily Name of font to process.
 * @returns Returns a name processed for use with the [current workflow](https://docs.expo.dev/archive/managed-vs-bare/).
 * @deprecated This method is not needed anymore and will be removed in the future.
 */
export function processFontFamily(fontFamily: string | null): string | null {
  return fontFamily;
}

// @needsAudit
/**
 * Synchronously detect if the font for `fontFamily` has finished loading.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @return Returns `true` if the font has fully loaded.
 */
export function isLoaded(fontFamily: string): boolean {
  if (Platform.OS === 'web') {
    return fontFamily in loaded || !!ExpoFontLoader.isLoaded(fontFamily);
  }
  return fontFamily in loaded || ExpoFontLoader.customNativeFonts?.includes(fontFamily);
}

// @needsAudit
/**
 * Synchronously detect if the font for `fontFamily` is still being loaded.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @returns Returns `true` if the font is still loading.
 */
export function isLoading(fontFamily: string): boolean {
  return fontFamily in loadPromises;
}

// @needsAudit
/**
 * Highly efficient method for loading fonts from static or remote resources which can then be used
 * with the platform's native text elements. In the browser this generates a `@font-face` block in
 * a shared style sheet for fonts. No CSS is needed to use this method.
 *
 * @template T The type of the first argument. If a string is provided, the second argument must be
 * a `FontSource`. If an object is provided, the second argument must be omitted.
 *
 * @param fontFamilyOrFontMap String or map of values that can be used as the `fontFamily` [style prop](https://reactnative.dev/docs/text#style)
 * with React Native `Text` elements.
 * @param source The font asset that should be loaded into the `fontFamily` namespace. Provide this argument only if the first
 * first argument is a string.
 *
 * @return Returns a promise that fulfils when the font has loaded. Often you may want to wrap the
 * method in a `try/catch/finally` to ensure the app continues if the font fails to load.
 */
export function loadAsync<T extends string | Record<string, FontSource>>(
  ...args: T extends string
    ? [fontFamilyOrFontMap: T, source: FontSource]
    : [fontFamilyOrFontMap: T]
): Promise<void> {
  // NOTE(EvanBacon): Static render pass on web must be synchronous to collect all fonts.
  // Because of this, `loadAsync` doesn't use the `async` keyword and deviates from the
  // standard Expo SDK style guide.
  const isServer = Platform.OS === 'web' && typeof window === 'undefined';

  const [fontFamilyOrFontMap, source] = args;

  if (typeof fontFamilyOrFontMap === 'object') {
    const fontMap = fontFamilyOrFontMap;
    const names = Object.keys(fontMap);

    if (isServer) {
      names.map((name) => registerStaticFont(name, fontMap[name]));
      return Promise.resolve();
    }

    return Promise.all(names.map((name) => loadFontInNamespaceAsync(name, fontMap[name]))).then(
      () => {}
    );
  }

  if (isServer) {
    registerStaticFont(fontFamilyOrFontMap, source);
    return Promise.resolve();
  }

  // we can safely cast source because we know that the first argument is a string and the second is required
  return loadFontInNamespaceAsync(fontFamilyOrFontMap, source as FontSource);
}

async function loadFontInNamespaceAsync(fontFamily: string, source: FontSource): Promise<void> {
  if (loaded[fontFamily]) {
    return;
  }

  if (loadPromises.hasOwnProperty(fontFamily)) {
    return loadPromises[fontFamily];
  }

  // Important: we want all callers that concurrently try to load the same font to await the same
  // promise. If we're here, we haven't created the promise yet. To ensure we create only one
  // promise in the program, we need to create the promise synchronously without yielding the event
  // loop from this point.

  const asset = getAssetForSource(source);
  loadPromises[fontFamily] = (async () => {
    try {
      await loadSingleFontAsync(fontFamily, asset);
      loaded[fontFamily] = true;
    } finally {
      delete loadPromises[fontFamily];
    }
  })();

  await loadPromises[fontFamily];
}

// @needsAudit
/**
 * Unloads all the custom fonts. This is used for testing.
 */
export async function unloadAllAsync(): Promise<void> {
  if (!ExpoFontLoader.unloadAllAsync) {
    throw new UnavailabilityError('expo-font', 'unloadAllAsync');
  }

  if (Object.keys(loadPromises).length) {
    throw new CodedError(
      `ERR_UNLOAD`,
      `Cannot unload fonts while they're still loading: ${Object.keys(loadPromises).join(', ')}`
    );
  }

  for (const fontFamily of Object.keys(loaded)) {
    delete loaded[fontFamily];
  }

  await ExpoFontLoader.unloadAllAsync();
}

// @needsAudit
/**
 * Unload custom fonts matching the `fontFamily`s and display values provided.
 * Because fonts are automatically unloaded on every platform this is mostly used for testing.
 *
 * @template T The type of the first argument. If a string is provided, the second argument must be
 * an `UnloadFontOptions`. If an object is provided, the second argument must be omitted.
 *
 * @param fontFamilyOrFontMap The name or names of the custom fonts that will be unloaded.
 * @param options When `fontFamilyOrFontMap` is a string, this should be the font source used to load
 * the custom font originally.
 */
export async function unloadAsync<T extends string | Record<string, UnloadFontOptions>>(
  ...args: T extends string
    ? [fontFamilyOrFontMap: T, options?: UnloadFontOptions]
    : [fontFamilyOrFontMap: T]
): Promise<void> {
  if (!ExpoFontLoader.unloadAsync) {
    throw new UnavailabilityError('expo-font', 'unloadAsync');
  }

  const [fontFamilyOrFontMap, options] = args;

  if (typeof fontFamilyOrFontMap === 'object') {
    const fontMap = fontFamilyOrFontMap;
    const names = Object.keys(fontMap);
    await Promise.all(names.map((name) => unloadFontInNamespaceAsync(name, fontMap[name])));
    return;
  }

  return await unloadFontInNamespaceAsync(fontFamilyOrFontMap, options);
}

async function unloadFontInNamespaceAsync(
  fontFamily: string,
  options?: UnloadFontOptions | null
): Promise<void> {
  if (!loaded[fontFamily]) {
    return;
  } else {
    delete loaded[fontFamily];
  }

  // Important: we want all callers that concurrently try to load the same font to await the same
  // promise. If we're here, we haven't created the promise yet. To ensure we create only one
  // promise in the program, we need to create the promise synchronously without yielding the event
  // loop from this point.

  if (!fontFamily) {
    throw new CodedError(`ERR_FONT_FAMILY`, `Cannot unload an empty name`);
  }

  await ExpoFontLoader.unloadAsync(fontFamily, options);
}

export { FontDisplay, FontResource, FontSource, UnloadFontOptions };
