import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import { FontResource, FontSource, FontDisplay } from './Font.types';

function uriFromFontSource(asset: FontSource): string | number | null {
  if (typeof asset === 'string') {
    return asset || null;
  } else if (typeof asset === 'number') {
    return uriFromFontSource(Asset.fromModule(asset));
  } else if (typeof asset === 'object' && typeof asset.uri === 'number') {
    return uriFromFontSource(asset.uri);
  } else if (typeof asset === 'object') {
    return asset.uri || (asset as Asset).localUri || (asset as FontResource).default || null;
  }

  return null;
}

function displayFromFontSource(asset: FontSource): FontDisplay {
  if (typeof asset === 'object' && 'display' in asset) {
    return asset.display || FontDisplay.AUTO;
  }

  return FontDisplay.AUTO;
}

export function getAssetForSource(source: FontSource): Asset | FontResource {
  const uri = uriFromFontSource(source);
  const display = displayFromFontSource(source);

  if (!uri || typeof uri !== 'string') {
    throwInvalidSourceError(uri);
  }

  return {
    uri,
    display,
  };
}

function throwInvalidSourceError(source: any): never {
  let type: string = typeof source;
  if (type === 'object') type = JSON.stringify(source, null, 2);
  throw new CodedError(
    `ERR_FONT_SOURCE`,
    `Expected font asset of type \`string | FontResource | Asset\` instead got: ${type}`
  );
}

// NOTE(EvanBacon): No async keyword!
export function loadSingleFontAsync(name: string, input: Asset | FontResource): Promise<void> {
  if (typeof input !== 'object' || typeof input.uri !== 'string' || (input as any).downloadAsync) {
    throwInvalidSourceError(input);
  }

  try {
    return ExpoFontLoader.loadAsync(name, input);
  } catch {
    // No-op.
  }

  return Promise.resolve();
}
