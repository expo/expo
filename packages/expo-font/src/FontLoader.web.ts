import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import ExpoFontLoader from './ExpoFontLoader';
import type { FontDisplay, FontFaceDefinition, FontResource, FontSource } from './Font.types';
import { normalizeWeight, resolveFaceStyle, resolveFaceWeight } from './fontFaceValidation';
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

// The shared declared-value check skips faces with an undeclared weight or style. On web an
// undeclared descriptor is not read from the font file — CSS defaults it to 'normal'/400 — so
// two faces can resolve to the same effective descriptors and the last one registered silently
// shadows the rest. Warn about that; ranges only collide when they are identical.
function warnOnCollidingFaces(fontFamily: string, fontDefinitions: FontFaceDefinition[]): void {
  const seenFaces = new Set<string>();
  for (const face of fontDefinitions) {
    const weight = resolveFaceWeight(face);
    const weightKey =
      normalizeWeight(weight) ?? (typeof weight === 'string' ? weight.trim().toLowerCase() : 400);
    const styleKey = (resolveFaceStyle(face) ?? 'normal').trim().toLowerCase();
    const key = `${weightKey}/${styleKey}`;
    if (seenFaces.has(key)) {
      console.warn(
        `Font family "${fontFamily}" declares two faces that both resolve to font-weight ` +
          `${weightKey} and font-style "${styleKey}" on web. The browser renders the last one ` +
          `registered and silently ignores the rest. Give each face a distinct weight or style.`
      );
      return;
    }
    seenFaces.add(key);
  }
}

export async function loadFontFamilyAsync(
  fontFamily: string,
  fontDefinitions: FontFaceDefinition[]
): Promise<void> {
  if (__DEV__) {
    warnOnCollidingFaces(fontFamily, fontDefinitions);
  }
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
