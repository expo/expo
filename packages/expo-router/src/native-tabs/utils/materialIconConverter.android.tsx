import { requireExpoSymbols } from '../../optional-libraries/expo-symbols';
import { NativeTabsTriggerPromiseIcon } from '../common/elements';
import { convertComponentSrcToImageSource } from './icon';

// Material glyph names. `string` keeps the optional `expo-symbols` peer out of published types.
type AndroidSymbol = string;

export function convertMaterialIconNameToImageSource(
  name: AndroidSymbol
): ReturnType<typeof convertComponentSrcToImageSource> {
  const { unstable_getMaterialSymbolSourceAsync } = requireExpoSymbols(
    "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
  );
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerPromiseIcon
      loader={() =>
        unstable_getMaterialSymbolSourceAsync(
          // The peer's parameter is its icon-name union. This file stays on `string` so the
          // published declarations do not import that optional peer.
          name as Parameters<typeof unstable_getMaterialSymbolSourceAsync>[0],
          24,
          'white'
        )
      }
    />
  );
}
