import type { convertComponentSrcToImageSource } from './icon';
import type { MaterialIcon } from '../common/elements';

export function convertMaterialIconNameToImageSource(
  name: MaterialIcon['md']
): ReturnType<typeof convertComponentSrcToImageSource> {
  console.warn(
    'Using convertMaterialIconNameToImageSource on unsupported platform. This is most likely an internal expo router bug.'
  );
  return undefined;
}
