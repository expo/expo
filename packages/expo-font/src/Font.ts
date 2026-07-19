import { Asset } from 'expo-asset';
import { CodedError, Platform, UnavailabilityError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import type {
  FontFaceDefinition,
  FontFamilyDefinition,
  FontMap,
  FontResource,
  FontSource,
  UnloadFontOptions,
} from './Font.types';
import { getAssetForSource, loadSingleFontAsync } from './FontLoader';
import {
  isLoadedInCache,
  isLoadedNative,
  loadPromises,
  markLoaded,
  purgeCache,
  purgeFontFamilyFromCache,
} from './memory';
import { registerStaticFont } from './server';

// @needsAudit
/**
 * Synchronously detect if the font for `fontFamily` has finished loading.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @return Returns `true` if the font has fully loaded.
 */
export function isLoaded(fontFamily: string): boolean {
  if (Platform.OS === 'web') {
    if (typeof ExpoFontLoader.isLoaded !== 'function') {
      throw new Error(
        `expected ExpoFontLoader.isLoaded to be a function, was ${typeof ExpoFontLoader.isLoaded}`
      );
    }
    return isLoadedInCache(fontFamily) || ExpoFontLoader.isLoaded(fontFamily);
  }
  return isLoadedNative(fontFamily);
}

/**
 * Synchronously get all the fonts that have been loaded.
 * This includes fonts that were bundled at build time using the config plugin, as well as those loaded at runtime using `loadAsync`.
 *
 * @returns Returns array of strings which you can use as `fontFamily` [style prop](https://reactnative.dev/docs/text#style).
 */
export function getLoadedFonts(): string[] {
  return ExpoFontLoader.getLoadedFonts();
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
 * An efficient method for loading fonts from static or remote resources which can then be used
 * with the platform's native text elements. In the browser, this generates a `@font-face` block in
 * a shared style sheet for fonts. No CSS is needed to use this method.
 *
 * > **Note**: We recommend using the [config plugin](#configuration-in-app-config) instead whenever possible.
 *
 * @param fontFamilyOrFontMap String, map of values that can be used as the `fontFamily`
 * [style prop](https://reactnative.dev/docs/text#style) with React Native `Text` elements, or an
 * array of [`FontFamilyDefinition`](#fontfamilydefinition)s for loading multiple faces per family.
 * @param source The font asset that should be loaded into the `fontFamily` namespace.
 *
 * @return Returns a promise that fulfils when the font has loaded. Often you may want to wrap the
 * method in a `try/catch/finally` to ensure the app continues if the font fails to load.
 */
export function loadAsync(fontFamilyOrFontMap: FontMap, source?: FontSource): Promise<void> {
  // NOTE(EvanBacon): Static render pass on web must be synchronous to collect all fonts.
  // Because of this, `loadAsync` doesn't use the `async` keyword and deviates from the
  // standard Expo SDK style guide.
  const isServer = Platform.OS === 'web' && typeof window === 'undefined';

  if (Array.isArray(fontFamilyOrFontMap)) {
    if (source) {
      return Promise.reject(
        new CodedError(
          `ERR_FONT_API`,
          `No fontFamily can be used for the provided source: ${source}. The second argument of \`loadAsync()\` can only be used with a \`string\` value as the first argument.`
        )
      );
    }
    const definitions = fontFamilyOrFontMap;

    if (isServer) {
      for (const { fontFamily, fontDefinitions } of definitions) {
        for (const face of fontDefinitions) {
          registerStaticFont(fontFamily, fontSourceFromFace(face));
        }
      }
      return Promise.resolve();
    }

    return Promise.all(definitions.map(loadFontFamilyInNamespaceAsync)).then(() => {});
  }

  if (typeof fontFamilyOrFontMap === 'object') {
    if (source) {
      return Promise.reject(
        new CodedError(
          `ERR_FONT_API`,
          `No fontFamily can be used for the provided source: ${source}. The second argument of \`loadAsync()\` can only be used with a \`string\` value as the first argument.`
        )
      );
    }
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

  return loadFontInNamespaceAsync(fontFamilyOrFontMap, source);
}

// Merges a face's `weight`/`style`/`display`/`testString` onto its `path`, falling back to
// values already present on `path` when it's a `FontResource`-shaped object. None of these are
// given a hardcoded default: leaving a property unset lets the generated `@font-face` rule omit
// that descriptor entirely, which is required for variable fonts (a single file can cover a
// range of weights/styles; forcing e.g. `font-weight: 400` on it would incorrectly restrict the
// face to only that one weight).
function fontSourceFromFace(face: FontFaceDefinition): FontSource {
  const { path, weight, style, display, testString } = face;

  if (path instanceof Asset) {
    return path;
  }

  const base: FontResource =
    typeof path === 'string' || typeof path === 'number' ? { uri: path } : path;

  return {
    ...base,
    weight: weight ?? base.weight,
    style: style ?? base.style,
    display: display ?? base.display,
    testString: testString ?? base.testString,
  };
}

async function loadFontFamilyInNamespaceAsync(definition: FontFamilyDefinition): Promise<void> {
  const { fontFamily, fontDefinitions } = definition;

  if (loadPromises.hasOwnProperty(fontFamily)) {
    return loadPromises[fontFamily];
  }

  const promise = Promise.all(
    fontDefinitions.map((face) => loadFontFaceInNamespaceAsync(fontFamily, face))
  ).then(() => {});

  loadPromises[fontFamily] = promise;
  promise.finally(() => {
    delete loadPromises[fontFamily];
  });

  return promise;
}

// Faces of the same `fontFamily` are cached and awaited individually (keyed by weight/style)
// since native and the JS-level cache in `memory.ts` can only track loaded state per name.
async function loadFontFaceInNamespaceAsync(
  fontFamily: string,
  face: FontFaceDefinition
): Promise<void> {
  const cacheKey = `${fontFamily}\0${face.weight ?? ''}\0${face.style ?? ''}`;

  if (isLoadedInCache(cacheKey)) {
    return;
  }

  if (loadPromises.hasOwnProperty(cacheKey)) {
    return loadPromises[cacheKey];
  }

  const asset = getAssetForSource(fontSourceFromFace(face));
  loadPromises[cacheKey] = (async () => {
    try {
      await loadSingleFontAsync(fontFamily, asset);
      markLoaded(fontFamily);
      markLoaded(cacheKey);
    } finally {
      delete loadPromises[cacheKey];
    }
  })();

  await loadPromises[cacheKey];
}

async function loadFontInNamespaceAsync(
  fontFamily: string,
  source?: FontSource | null
): Promise<void> {
  if (!source) {
    throw new CodedError(
      `ERR_FONT_SOURCE`,
      `Cannot load null or undefined font source: { "${fontFamily}": ${source} }. Expected asset of type \`FontSource\` for fontFamily of name: "${fontFamily}"`
    );
  }

  // we consult the native module to see if the font is already loaded
  // this is slower than checking the cache but can help avoid loading the same font n times
  if (isLoaded(fontFamily)) {
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
      markLoaded(fontFamily);
    } finally {
      delete loadPromises[fontFamily];
    }
  })();

  await loadPromises[fontFamily];
}

// @needsAudit
/**
 * Unloads all the custom fonts. This is used for testing.
 * @hidden
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
  purgeCache();
  await ExpoFontLoader.unloadAllAsync();
}

// @needsAudit
/**
 * Unload custom fonts matching the `fontFamily`s and display values provided.
 * This is used for testing.
 *
 * @param fontFamilyOrFontMap The name or names of the custom fonts that will be unloaded.
 * @param options When `fontFamilyOrFontMap` is a string, this should be the font source used to load
 * the custom font originally.
 * @hidden
 */
export async function unloadAsync(
  fontFamilyOrFontMap: string | Record<string, UnloadFontOptions>,
  options?: UnloadFontOptions
): Promise<void> {
  if (!ExpoFontLoader.unloadAsync) {
    throw new UnavailabilityError('expo-font', 'unloadAsync');
  }
  if (typeof fontFamilyOrFontMap === 'object') {
    if (options) {
      throw new CodedError(
        `ERR_FONT_API`,
        `No fontFamily can be used for the provided options: ${options}. The second argument of \`unloadAsync()\` can only be used with a \`string\` value as the first argument.`
      );
    }
    const fontMap = fontFamilyOrFontMap;
    const names = Object.keys(fontMap);
    await Promise.all(names.map((name) => unloadFontInNamespaceAsync(name, fontMap[name])));
    return;
  }

  return await unloadFontInNamespaceAsync(fontFamilyOrFontMap, options);
}

async function unloadFontInNamespaceAsync(
  fontFamily: string,
  options?: UnloadFontOptions
): Promise<void> {
  if (!isLoaded(fontFamily)) {
    return;
  } else {
    purgeFontFamilyFromCache(fontFamily);
  }

  // Important: we want all callers that concurrently try to load the same font to await the same
  // promise. If we're here, we haven't created the promise yet. To ensure we create only one
  // promise in the program, we need to create the promise synchronously without yielding the event
  // loop from this point.

  if (!fontFamily) {
    throw new CodedError(`ERR_FONT_FAMILY`, `Cannot unload an empty name`);
  }
  if (!ExpoFontLoader.unloadAsync) {
    throw new UnavailabilityError('expo-font', 'unloadAsync');
  }
  await ExpoFontLoader.unloadAsync(fontFamily, options);
}

export {
  FontDisplay,
  type FontSource,
  type FontResource,
  type FontFaceDefinition,
  type FontFamilyDefinition,
  type FontMap,
  type UnloadFontOptions,
  type ServerFontResourceDescriptor,
} from './Font.types';
