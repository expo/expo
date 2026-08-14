import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useContext } from 'react';

/**
 * Native tabs don't provide the JS bottom tab bar height context,
 * so fall back to 0 and let the native content insets handle the tab bar.
 */
export default function useOptionalBottomTabBarHeight(): number {
  return useContext(BottomTabBarHeightContext) ?? 0;
}
