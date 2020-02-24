import { CodedError } from '@unimodules/core';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import ExpoFontLoader from './ExpoFontLoader';
import { FontResource, FontSource } from './Font.types';

const isInClient = Constants.appOwnership === 'expo';
const isInIOSStandalone = Constants.appOwnership === 'standalone' && Platform.OS === 'ios';

export function fontFamilyNeedsScoping(name: string): boolean {
  return (
    (isInClient || isInIOSStandalone) &&
    !Constants.systemFonts.includes(name) &&
    name !== 'System' &&
    !name.includes(Constants.sessionId)
  );
}

export function getAssetForSource(source: FontSource): Asset | FontResource {
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

export async function loadSingleFontAsync(
  name: string,
  input: Asset | FontResource
): Promise<void> {
  const asset = input as Asset;
  if (!asset.downloadAsync) {
    throw new CodedError(
      `ERR_FONT_SOURCE`,
      '`loadSingleFontAsync` expected resource of type `Asset` from expo-asset on native'
    );
  }

  await asset.downloadAsync();
  if (!asset.downloaded) {
    throw new CodedError(`ERR_DOWNLOAD`, `Failed to download asset for font "${name}"`);
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
