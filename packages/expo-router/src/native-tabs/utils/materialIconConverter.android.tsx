import type { AndroidSymbol } from 'expo-symbols';

import { requireExpoSymbols } from '../../optional-libraries/expo-symbols';
import { NativeTabsTriggerPromiseIcon } from '../common/elements';
import { convertComponentSrcToImageSource } from './icon';

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  const { unstable_getMaterialSymbolSourceAsync } = requireExpoSymbols(
    "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
  );
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() => unstable_getMaterialSymbolSourceAsync(name, 24, 'white')}
    />
  );
}
