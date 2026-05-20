// This module is the swap target when EXPO_ROUTER_DISABLE_NATIVE_TABS_MD is set on Android, which lets the
// Metro resolver tree-shake `expo-symbols` from the Android bundle. The type-only `expo-symbols`
// import below is erased by the compiler, so no runtime dependency is introduced.
import type { convertMaterialIconNameToImageSource as BaseType } from './materialIconConverter';

export function convertMaterialIconNameToImageSource(
  ..._args: Parameters<typeof BaseType>
): ReturnType<typeof BaseType> {
  throw new Error(
    'NativeTabs `md` (Material Symbols) icons are not available. Material Symbols support was disabled via EXPO_ROUTER_DISABLE_NATIVE_TABS_MD. Use the `src` or `drawable` icon prop instead or remove the EXPO_ROUTER_DISABLE_NATIVE_TABS_MD.'
  );
}
