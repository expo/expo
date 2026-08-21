import { Asset } from 'expo-asset';

import type { FontFaceDefinition, FontResource, FontSource } from './Font.types';

// Merges a face's descriptors onto its `path`. Nothing gets a default: an unset property must
// stay unset, or a variable font's face would be pinned to a single weight/style.
export function fontSourceFromFace(face: FontFaceDefinition): FontSource {
  const { path, weight, style, display, testString } = face;

  if (path instanceof Asset) {
    return {
      uri: path.uri,
      ...(weight !== undefined ? { weight } : null),
      ...(style !== undefined ? { style } : null),
      ...(display !== undefined ? { display } : null),
      ...(testString !== undefined ? { testString } : null),
    };
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
