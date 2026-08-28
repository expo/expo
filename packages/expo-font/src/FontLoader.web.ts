import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import type { FontDisplay, FontFaceDefinition, FontResource, FontSource } from './Font.types';
import { fontSourceFromFace } from './fontSourceFromFace';

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

function displayFromFontSource(asset: FontSource): FontDisplay | undefined {
  if (typeof asset === 'object' && 'display' in asset) {
    return asset.display ?? undefined;
  }

  return undefined;
}

function weightFromFontSource(asset: FontSource): FontResource['weight'] {
  if (typeof asset === 'object' && 'weight' in asset) {
    return asset.weight ?? undefined;
  }

  return undefined;
}

function styleFromFontSource(asset: FontSource): FontResource['style'] {
  if (typeof asset === 'object' && 'style' in asset) {
    return asset.style ?? undefined;
  }

  return undefined;
}

export function getAssetForSource(source: FontSource): Asset | FontResource {
  const uri = uriFromFontSource(source);
  const display = displayFromFontSource(source);
  const weight = weightFromFontSource(source);
  const style = styleFromFontSource(source);
  if (!uri || typeof uri !== 'string') {
    throwInvalidSourceError(uri);
  }

  return {
    uri,
    display,
    weight,
    style,
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

export async function loadFontFamilyAsync(
  fontFamily: string,
  fontDefinitions: FontFaceDefinition[]
): Promise<void> {
  await Promise.all(
    fontDefinitions.map((face) => {
      const asset = getAssetForSource(fontSourceFromFace(face));
      return loadSingleFontAsync(fontFamily, asset);
    })
  );
}

// NOTE(EvanBacon): No async keyword!
export function loadSingleFontAsync(name: string, input: Asset | FontResource): Promise<void> {
  if (typeof input !== 'object' || typeof input.uri !== 'string' || (input as any).downloadAsync) {
    throwInvalidSourceError(input);
  }

  return ExpoFontLoader.loadAsync(name, input);
}
