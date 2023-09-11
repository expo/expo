import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import { FontResource, FontSource, FontDisplay } from './Font.types';

function uriFromFontSource(asset: any): string | null {
  if (typeof asset === 'string') {
    return asset || null;
  } else if (typeof asset === 'object') {
    return asset.uri || asset.localUri || asset.default || null;
  } else if (typeof asset === 'number') {
    return uriFromFontSource(Asset.fromModule(asset));
  }
  return null;
}

function displayFromFontSource(asset: any): FontDisplay | undefined {
  return asset.display || FontDisplay.AUTO;
}

export function fontFamilyNeedsScoping(name: string): boolean {
  return false;
}

export function getAssetForSource(source: FontSource): Asset | FontResource {
  const uri = uriFromFontSource(source);
  const display = displayFromFontSource(source);

  if (!uri || typeof uri !== 'string') {
    throwInvalidSourceError(uri);
  }

  return {
    uri: uri!,
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

export function getNativeFontName(name: string): string {
  return name;
}
