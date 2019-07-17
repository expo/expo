import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { FontSource } from './FontTypes';
import ExpoFontLoader from './ExpoFontLoader';

/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export type FontSource = string | number | Asset;

const isInClient = Constants.appOwnership === 'expo';

export function fontFamilyNeedsScoping(name: string): boolean {
  return (
    isInClient &&
    !Constants.systemFonts.includes(name) &&
    name !== 'System' &&
    !name.includes(Constants.sessionId)
  );
}

export function getAssetForSource(source: FontSource): Asset {
  if (source instanceof Asset) {
    return source;
  }

  if (typeof source === 'string') {
    return Asset.fromURI(source);
  } else if (typeof source === 'number') {
    return Asset.fromModule(source);
  } else if (typeof source === 'object' && typeof source.uri !== 'undefined') {
      return getAssetForSource(source.uri);
  }

  // @ts-ignore Error: Type 'string' is not assignable to type 'Asset'
  // We can't have a string here, we would have thrown an error if !isWeb
  // or returned Asset.fromModule if isWeb.
  return source;
}

export async function loadSingleFontAsync(name: string, asset: Asset): Promise<void> {
  await asset.downloadAsync();
  if (!asset.downloaded) {
    throw new Error(`Failed to download asset for font "${name}"`);
  }
  await ExpoFontLoader.loadAsync(getNativeFontName(name), asset.localUri);
}

export function getNativeFontName(name: string): string {
  if (fontFamilyNeedsScoping(name)) {
    return `${Constants.sessionId}-${name}`;
  } else {
    return name;
  }
}
