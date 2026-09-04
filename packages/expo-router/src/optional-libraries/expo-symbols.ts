type ExpoSymbols = typeof import('expo-symbols');

let expoSymbols: ExpoSymbols | undefined;

try {
  expoSymbols = require('expo-symbols');
} catch {}

export function requireExpoSymbols(): ExpoSymbols {
  if (!expoSymbols) {
    throw new Error(
      "NativeTabs.Trigger.Icon `md` icons on Android require 'expo-symbols'. Install it with `npx expo install expo-symbols` or use the `src` or `drawable` prop."
    );
  }
  return expoSymbols;
}
