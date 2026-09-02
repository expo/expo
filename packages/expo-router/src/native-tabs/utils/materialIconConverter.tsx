import type { AndroidSymbol } from 'expo-symbols';

import type { convertComponentSrcToImageSource } from './icon';

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  console.warn(
    'Using convertMaterialIconNameToImageSource on unsupported platform. This is most likely an internal expo router bug.'
  );
  return undefined;
}
