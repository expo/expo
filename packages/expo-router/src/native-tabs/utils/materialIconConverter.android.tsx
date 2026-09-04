import type { AndroidSymbol } from 'expo-symbols';

import { requireExpoSymbols } from '../../optional-libraries/expo-symbols';
import { NativeTabsTriggerPromiseIcon } from '../common/elements';
import { convertComponentSrcToImageSource } from './icon';

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  const { unstable_getMaterialSymbolSourceAsync } = requireExpoSymbols();
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() => unstable_getMaterialSymbolSourceAsync(name, 24, 'white')}
    />
  );
}
