import { unstable_getMaterialSymbolSourceAsync, type AndroidSymbol } from 'expo-symbols';

import { convertComponentSrcToImageSource } from './icon';
import { NativeTabsTriggerPromiseIcon } from '../common/elements';

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() => unstable_getMaterialSymbolSourceAsync(name, 24, 'white')}
    />
  );
}
