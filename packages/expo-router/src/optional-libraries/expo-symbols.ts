type ExpoSymbols = typeof import('expo-symbols');

let expoSymbols: ExpoSymbols | undefined;

try {
  expoSymbols = require('expo-symbols');
} catch {}

export function requireExpoSymbols(
  errorMessage = "The 'expo-symbols' package needs to be installed in order to use this feature."
): ExpoSymbols {
  if (!expoSymbols) {
    throw new Error(errorMessage);
  }
  return expoSymbols;
}
