import { Platform } from 'react-native';

import type { NativeStackNavigationOptions } from '../types';

let isLegacyHeaderAppearance = false;

/**
 * Restores the previous iOS header appearance for all native stack screens: an opaque header
 * that uses the theme fonts, with content below the header. Call it before the root layout
 * renders, for example at the top level of the root `_layout` file.
 *
 * @deprecated In a future release, the native iOS header appearance becomes the only behavior
 * and this function will be removed.
 * @platform ios
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { enableLegacyHeaderAppearance, Stack } from 'expo-router';
 *
 * enableLegacyHeaderAppearance();
 *
 * export default function RootLayout() {
 *   return <Stack />;
 * }
 * ```
 */
export function enableLegacyHeaderAppearance() {
  isLegacyHeaderAppearance = true;
}

export function isLegacyHeaderAppearanceEnabled() {
  return isLegacyHeaderAppearance;
}

export function getPlatformHeaderTransparent(
  headerTransparent: NativeStackNavigationOptions['headerTransparent']
) {
  return typeof headerTransparent === 'object'
    ? Platform.select(headerTransparent)
    : headerTransparent;
}
