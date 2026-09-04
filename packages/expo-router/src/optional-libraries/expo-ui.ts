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

export function requireExpoUI(): { expoUI: ExpoUI; modifiers: ExpoUIModifiers } {
  if (!expoUI || !modifiers) {
    throw new Error(
      "Stack.Toolbar on Android requires '@expo/ui'. Install it with `npx expo install @expo/ui` and rebuild your app."
    );
  }
  return { expoUI, modifiers };
}
