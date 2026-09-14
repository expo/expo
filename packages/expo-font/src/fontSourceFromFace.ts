import { Asset } from 'expo-asset';

import type { FontFaceDefinition, FontResource, FontSource } from './Font.types';
import { resolveFaceStyle, resolveFaceWeight } from './fontFaceValidation';

export function fontSourceFromFace(face: FontFaceDefinition): FontSource {
  const { path, display, testString } = face;
  const weight = resolveFaceWeight(face);
  const style = resolveFaceStyle(face);

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
    weight,
    style,
    display: display ?? base.display,
    testString: testString ?? base.testString,
  };
}
