import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import type { FontFaceDefinition, FontResource, FontSource } from './Font.types';
import { FontDisplay } from './Font.types';

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

function testStringFromFontSource(asset: FontSource): string | undefined {
  if (typeof asset === 'object' && 'testString' in asset) {
    return asset.testString ?? undefined;
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
  const testString = testStringFromFontSource(source);
  const weight = weightFromFontSource(source);
  const style = styleFromFontSource(source);
  if (!uri || typeof uri !== 'string') {
    throwInvalidSourceError(uri);
  }

  return {
    uri,
    display,
    testString,
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

// Merges a face's `weight`/`style`/`display`/`testString` onto its `path`, falling back to
// values already present on `path` when it's a `FontResource`-shaped object, so the generated
// `@font-face` rule carries the properties declared on the `FontFaceDefinition`.
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

// Loads every face concurrently, each as its own `@font-face` rule under the shared
// `fontFamily` name, matching the pre-array-API behavior of calling `loadAsync` once per face.
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

  // On the server, scope-misuse throws must propagate; a silent missing font is worse.
  if (typeof window === 'undefined') {
    return ExpoFontLoader.loadAsync(name, input);
  }

  // NOTE(@hassankhan): This seems broken for async calls; we should investigate removing
  // `fontfaceobserver` altogether
  try {
    return ExpoFontLoader.loadAsync(name, input);
  } catch {
    // `FontObserver` rejects on unsupported browsers/network timeouts (see #22954). The font
    // still renders via the injected stylesheet; swallow the verification failure rather than
    // surface it as an unhandled promise rejection.
  }

  return Promise.resolve();
}
