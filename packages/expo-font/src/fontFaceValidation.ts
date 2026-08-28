import { Asset } from 'expo-asset';
import { CodedError } from 'expo-modules-core';

import type { FontFaceDefinition, FontFamilyDefinition, FontResource } from './Font.types';

// Converts a declared weight to the single number native face selection needs. A value that
// doesn't map to one number — a web-only range like '100 900', or garbage — returns undefined,
// so native falls back to the weight embedded in the font file.
export function normalizeWeight(weight: FontFaceDefinition['weight']): number | undefined {
  if (weight == null) {
    return undefined;
  }
  if (typeof weight === 'number') {
    return Number.isFinite(weight) ? weight : undefined;
  }
  const lower = weight.trim().toLowerCase();
  if (lower === 'normal') {
    return 400;
  }
  if (lower === 'bold') {
    return 700;
  }
  const numeric = Number(lower);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function normalizeStyle(
  style: FontFaceDefinition['style']
): 'normal' | 'italic' | undefined {
  if (style == null) {
    return undefined;
  }
  // Case-insensitive like the CSS keyword web receives, so 'Italic' slants on every platform.
  const lower = style.trim().toLowerCase();
  return lower === 'italic' || lower === 'oblique' ? 'italic' : 'normal';
}

function resourceFromPath(path: FontFaceDefinition['path']): FontResource | undefined {
  if (path instanceof Asset || typeof path === 'string' || typeof path === 'number') {
    return undefined;
  }
  return path;
}

// Use this everywhere a face's weight is read, so native and web don't drift.
export function resolveFaceWeight(face: FontFaceDefinition): FontFaceDefinition['weight'] {
  return face.weight ?? resourceFromPath(face.path)?.weight;
}

export function resolveFaceStyle(face: FontFaceDefinition): FontFaceDefinition['style'] {
  return face.style ?? resourceFromPath(face.path)?.style;
}

export function assertValidFontFaces(
  fontFamily: string,
  fontDefinitions: FontFaceDefinition[]
): void {
  if (typeof fontFamily !== 'string' || fontFamily.length === 0) {
    throw new CodedError(
      `ERR_FONT_API`,
      `Expected a non-empty string for \`fontFamily\`, instead got ${JSON.stringify(fontFamily)}. Set \`fontFamily\` to the name to use as the \`fontFamily\` style prop.`
    );
  }
  if (!Array.isArray(fontDefinitions) || fontDefinitions.length === 0) {
    throw new CodedError(
      `ERR_FONT_API`,
      `No font faces were provided for font family "${fontFamily}". Set \`fontDefinitions\` to a non-empty array of \`FontFaceDefinition\`s.`
    );
  }
  // Two faces may only collide when both fully declare weight and style; an undeclared value is
  // resolved from the font file at load time, so it can't be compared here.
  const seenFaces = new Set<string>();
  for (const face of fontDefinitions) {
    if (typeof face !== 'object' || face === null || face.path == null) {
      throw new CodedError(
        `ERR_FONT_API`,
        `A face of font family "${fontFamily}" has no \`path\`. Set the face's \`path\` to a \`FontSource\`.`
      );
    }
    const weight = normalizeWeight(resolveFaceWeight(face));
    const style = normalizeStyle(resolveFaceStyle(face));
    if (weight === undefined || style === undefined) {
      continue;
    }
    const key = `${weight}/${style}`;
    if (seenFaces.has(key)) {
      throw new CodedError(
        `ERR_FONT_API`,
        `Font family "${fontFamily}" declares two faces with weight ${weight} and style "${style}". Give each face a distinct weight or style so the correct face is selected at render time.`
      );
    }
    seenFaces.add(key);
  }
}

export function assertValidFontFamilyDefinitions(
  definitions: unknown[]
): asserts definitions is FontFamilyDefinition[] {
  const seenFamilies = new Set<unknown>();
  for (const definition of definitions) {
    if (
      typeof definition !== 'object' ||
      definition === null ||
      Array.isArray(definition) ||
      !('fontFamily' in definition) ||
      !('fontDefinitions' in definition)
    ) {
      throw new CodedError(
        `ERR_FONT_API`,
        `Expected an object with \`fontFamily\` and \`fontDefinitions\`, instead got ${JSON.stringify(definition)}. Set each array element to \`{ fontFamily, fontDefinitions }\`.`
      );
    }
    const { fontFamily } = definition as FontFamilyDefinition;
    if (seenFamilies.has(fontFamily)) {
      throw new CodedError(
        `ERR_FONT_API`,
        `Font family "${fontFamily}" is declared more than once in this \`loadAsync\` call. Declare each \`fontFamily\` once, with all of its faces in one \`fontDefinitions\` array.`
      );
    }
    seenFamilies.add(fontFamily);
  }
}
