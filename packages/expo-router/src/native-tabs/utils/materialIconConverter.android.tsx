import type { AndroidSymbol } from 'expo-symbols';

import { convertComponentSrcToImageSource } from './icon';
import { getExpoSymbols } from '../../optional-dependencies/expo-symbols';
import { NativeTabsTriggerPromiseIcon } from '../common/elements';

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() =>
        getExpoSymbols(
          'Material icons in `NativeTabs` on Android'
        ).unstable_getMaterialSymbolSourceAsync(name, 24, 'white')
      }
    />
  );
}
