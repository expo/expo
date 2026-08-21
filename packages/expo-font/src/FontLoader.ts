import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader, { type NativeFontFace } from './ExpoFontLoader';
import type { FontFaceDefinition, FontResource, FontSource } from './Font.types';

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

  return source;
}

async function downloadFontAssetAsync(name: string, input: Asset | FontResource): Promise<Asset> {
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
  return asset;
}

export async function loadSingleFontAsync(
  name: string,
  input: Asset | FontResource
): Promise<void> {
  const asset = await downloadFontAssetAsync(name, input);
  await ExpoFontLoader.loadAsync(name, asset.localUri);
}

// Returns `undefined` (rather than defaulting to 400) for an unset or invalid weight so callers
// can tell "not specified" apart from "specified as regular".
function normalizeWeight(weight: FontFaceDefinition['weight']): number | undefined {
  if (weight == null) {
    return undefined;
  }

  let numeric: number;
  if (typeof weight === 'number') {
    numeric = weight;
  } else if (weight === 'normal') {
    numeric = 400;
  } else if (weight === 'bold') {
    numeric = 700;
  } else {
    numeric = parseInt(weight, 10);
  }

  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 1000) {
    throw new CodedError(
      `ERR_FONT_API`,
      `Invalid font weight "${weight}". Set the face's \`weight\` to a number from 1 to 1000, "normal", or "bold".`
    );
  }
  return numeric;
}

function normalizeStyle(style: FontFaceDefinition['style']): 'normal' | 'italic' | undefined {
  if (style == null) {
    return undefined;
  }
  return style === 'italic' || style === 'oblique' ? 'italic' : 'normal';
}

/**
 * Normalizes each face's `weight` and `style` for the native module. Throws `ERR_FONT_API` for a
 * `weight` that is not a number from 1 to 1000, or a keyword or numeric string resolving to one.
 */
export function getNativeFontFaces(
  fontDefinitions: FontFaceDefinition[]
): Pick<NativeFontFace, 'weight' | 'style'>[] {
  return fontDefinitions.map((face) => ({
    weight: normalizeWeight(face.weight),
    style: normalizeStyle(face.style),
  }));
}

/**
 * Downloads every face's asset in parallel, then makes a single native call so all faces of a
 * family are registered together.
 */
export async function loadFontFamilyAsync(
  fontFamily: string,
  fontDefinitions: FontFaceDefinition[]
): Promise<void> {
  const assets = fontDefinitions.map((face) => getAssetForSource(face.path));
  await Promise.all(assets.map((asset) => downloadFontAssetAsync(fontFamily, asset)));

  const normalizedFaces = getNativeFontFaces(fontDefinitions);
  const faces: NativeFontFace[] = assets.map((asset, index) => {
    // `normalizedFaces` has one entry per `fontDefinitions`/`assets` entry, in the same order.
    const { weight, style } = normalizedFaces[index]!;
    const face: NativeFontFace = { localUri: (asset as Asset).localUri! };
    if (weight !== undefined) {
      face.weight = weight;
    }
    if (style !== undefined) {
      face.style = style;
    }
    return face;
  });

  await ExpoFontLoader.loadFontFamilyAsync(fontFamily, faces);
}
