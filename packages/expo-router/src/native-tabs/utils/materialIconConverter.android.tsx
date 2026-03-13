import { unstable_getMaterialSymbolSourceAsync } from 'expo-symbols';

import { convertComponentSrcToImageSource } from './icon';
import { NativeTabsTriggerPromiseIcon, type MaterialIcon } from '../common/elements';

export function convertMaterialIconNameToImageSource(
  name: MaterialIcon['md']
): ReturnType<typeof convertComponentSrcToImageSource> {
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() => unstable_getMaterialSymbolSourceAsync(name, 24, 'white')}
    />
  );
}
