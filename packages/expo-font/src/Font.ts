import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { Platform } from '@unimodules/core';

import ExpoFontLoader from './ExpoFontLoader';

/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
type FontSource = string | number | Asset;

const isWeb = Platform.OS === 'web';
const isInClient = !isWeb && Constants.appOwnership === 'expo';
const isInIOSStandalone =
  Constants.appOwnership === 'standalone' && Platform.OS === 'ios';

const loaded: { [name: string]: boolean } = {};
const loadPromises: { [name: string]: Promise<void> } = {};

function fontFamilyNeedsScoping(name: string): boolean {
  return (
    (isInClient || isInIOSStandalone) &&
    !Constants.systemFonts.includes(name) &&
    name !== 'System' &&
    !name.includes(Constants.sessionId)
  );
}

/**
 * Used to transform font family names to the scoped name. This does not need to
 * be called in standalone or bare apps but it will return unscoped font family
 * names if it is called in those contexts.
 * note(brentvatne): at some point we may want to warn if this is called
 * outside of a managed app.
 */
export function processFontFamily(name: string | null): string | null {
  if (!name || !fontFamilyNeedsScoping(name)) {
    return name;
  }

  if (!isLoaded(name)) {
    if (__DEV__) {
      if (isLoading(name)) {
        console.error(
          `You started loading the font "${name}", but used it before it finished loading.\n
- You need to wait for Font.loadAsync to complete before using the font.\n
- We recommend loading all fonts before rendering the app, and rendering only Expo.AppLoading while waiting for loading to complete.`
        );
      } else {
        console.error(
          `fontFamily "${name}" is not a system font and has not been loaded through Font.loadAsync.\n
- If you intended to use a system font, make sure you typed the name correctly and that it is supported by your device operating system.\n
- If this is a custom font, be sure to load it with Font.loadAsync.`
        );
      }
    }

    return 'System';
  }

  return `ExpoFont-${_getNativeFontName(name)}`;
}

export function isLoaded(name: string): boolean {
  return loaded.hasOwnProperty(name);
}

export function isLoading(name: string): boolean {
  return loadPromises.hasOwnProperty(name);
}

export async function loadAsync(
  nameOrMap: string | { [name: string]: FontSource },
  source?: FontSource
): Promise<void> {
  if (typeof nameOrMap === 'object') {
    const fontMap = nameOrMap;
    const names = Object.keys(fontMap);
    await Promise.all(names.map(name => loadAsync(name, fontMap[name])));
    return;
  }

  const name = nameOrMap;

  if (loaded[name]) {
    return;
  }

  if (loadPromises[name]) {
    return loadPromises[name];
  }

  // Important: we want all callers that concurrently try to load the same font to await the same
  // promise. If we're here, we haven't created the promise yet. To ensure we create only one
  // promise in the program, we need to create the promise synchronously without yielding the event
  // loop from this point.

  if (!source) {
    throw new Error(`No source from which to load font "${name}"`);
  }
  const asset = _getAssetForSource(source);
  loadPromises[name] = (async () => {
    try {
      await _loadSingleFontAsync(name, asset);
      loaded[name] = true;
    } finally {
      delete loadPromises[name];
    }
  })();

  await loadPromises[name];
}

function _getAssetForSource(source: FontSource): Asset {
  if (source instanceof Asset) {
    return source;
  }

  if (!isWeb && typeof source === 'string') {
    return Asset.fromURI(source);
  }

  if (isWeb || typeof source === 'number') {
    return Asset.fromModule(source);
  }

  // @ts-ignore Error: Type 'string' is not assignable to type 'Asset'
  // We can't have a string here, we would have thrown an error if !isWeb
  // or returned Asset.fromModule if isWeb.
  return source;
}

async function _loadSingleFontAsync(name: string, asset: Asset): Promise<void> {
  await asset.downloadAsync();
  if (!asset.downloaded) {
    throw new Error(`Failed to download asset for font "${name}"`);
  }
  await ExpoFontLoader.loadAsync(_getNativeFontName(name), asset.localUri);
}

function _getNativeFontName(name: string): string {
  if (fontFamilyNeedsScoping(name)) {
    return `${Constants.sessionId}-${name}`;
  } else {
    return name;
  }
}

declare var module: any;

if (module && module.exports) {
  let wasImportWarningShown = false;
  // @ts-ignore: Temporarily define an export named "Font" for legacy compatibility
  Object.defineProperty(exports, 'Font', {
    get() {
      if (!wasImportWarningShown) {
        console.warn(
          `The syntax "import { Font } from 'expo-font'" is deprecated. Use "import * as Font from 'expo-font'" or import named exports instead. Support for the old syntax will be removed in SDK 33.`
        );
        wasImportWarningShown = true;
      }
      return {
        processFontFamily,
        isLoaded,
        isLoading,
        loadAsync,
      };
    },
  });
}
