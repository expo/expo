import type { convertComponentSrcToImageSource } from './icon';

// Material glyph names. `string` keeps the optional `expo-symbols` peer out of published types.
type AndroidSymbol = string;

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  console.warn(
    'Using convertMaterialIconNameToImageSource on unsupported platform. This is most likely an internal expo router bug.'
  );
  return undefined;
}
