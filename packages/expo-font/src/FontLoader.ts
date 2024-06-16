import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import { FontResource, FontSource } from './Font.types';

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
  await ExpoFontLoader.loadAsync(name, asset.localUri);
}
