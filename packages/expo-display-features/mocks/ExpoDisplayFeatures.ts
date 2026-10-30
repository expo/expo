/**
 * Jest mock for the native ExpoDisplayFeatures module, following the same
 * convention as other expo-* packages' mocks/ directories (see e.g.
 * expo-clipboard/mocks/ExpoClipboard.ts) - jest-expo's preset picks this up
 * automatically by matching the file name to the native module name passed
 * to requireNativeModule('ExpoDisplayFeatures').
 */

export async function getDisplayFeaturesAsync(): Promise<unknown[]> {
  return [];
}

export async function getHingeAsync(): Promise<unknown | null> {
  return null;
}
