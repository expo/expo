type ExpoUI = typeof import('@expo/ui/jetpack-compose');
type ExpoUIModifiers = typeof import('@expo/ui/jetpack-compose/modifiers');

let expoUI: ExpoUI | undefined;
let modifiers: ExpoUIModifiers | undefined;

try {
  const loadedExpoUI: ExpoUI = require('@expo/ui/jetpack-compose');
  const loadedModifiers: ExpoUIModifiers = require('@expo/ui/jetpack-compose/modifiers');
  expoUI = loadedExpoUI;
  modifiers = loadedModifiers;
} catch {}

export function requireExpoUI(
  errorMessage = "The '@expo/ui' package needs to be installed in order to use this feature."
): { expoUI: ExpoUI; modifiers: ExpoUIModifiers } {
  if (!expoUI || !modifiers) {
    throw new Error(errorMessage);
  }
  return { expoUI, modifiers };
}
