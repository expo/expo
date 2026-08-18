import { unstable_getMaterialSymbolSourceAsync, type AndroidSymbol } from 'expo-symbols';

import { NativeTabsTriggerPromiseIcon } from '../common/elements';
import { convertComponentSrcToImageSource } from './icon';

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() => unstable_getMaterialSymbolSourceAsync(name, 24, 'white')}
    />
  );
}
