import type { AndroidSymbol } from 'expo-symbols';
import type { ImageSourcePropType } from 'react-native';

/**
 * No-op on iOS and web — Material Design icons are only resolved on Android.
 */
export function useMaterialIconSource(
  _name: AndroidSymbol | undefined
): ImageSourcePropType | undefined {
  return undefined;
}
