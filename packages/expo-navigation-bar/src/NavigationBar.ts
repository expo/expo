import { type EventSubscription, UnavailabilityError } from 'expo-modules-core';
import { useEffect, useState } from 'react';

import type {
  NavigationBarStyle,
  NavigationBarVisibility,
  NavigationBarVisibilityEvent,
} from './NavigationBar.types';

/**
 * Observe changes to the system navigation bar.
 * Due to platform constraints, this callback will also be triggered when the status bar visibility changes.
 *
 * @example
 * ```ts
 * NavigationBar.addVisibilityListener(({ visibility }) => {
 *   // ...
 * });
 * ```
 */
export function addVisibilityListener(
  listener: (event: NavigationBarVisibilityEvent) => void
): EventSubscription {
  throw new UnavailabilityError('NavigationBar', 'addVisibilityListener');
}

/**
 * Set the navigation bar's visibility.
 *
 * @param visibility Based on CSS visibility property.
 * @platform android
 *
 * @example
 * ```ts
 * NavigationBar.setVisibilityAsync("hidden");
 * ```
 */
export async function setVisibilityAsync(visibility: NavigationBarVisibility): Promise<void> {
  console.warn('`setVisibilityAsync` is only available on Android');
}

/**
 * Get the navigation bar's visibility.
 *
 * @returns Navigation bar's current visibility status. Returns `hidden` on unsupported platforms (iOS, web).
 *
 * @example
 * ```ts
 * const visibility = await NavigationBar.getVisibilityAsync();
 * ```
 */
export async function getVisibilityAsync(): Promise<NavigationBarVisibility> {
  console.warn('`getVisibilityAsync` is only available on Android');
  return 'hidden';
}

/**
 * Sets the style of the navigation bar.
 * > This will have an effect when the following conditions are met:
 * > - The `enforceContrast` option of the `expo-navigation-bar` plugin is set to `false`.
 * > - The device is using the three-button navigation bar.
 *
 * > Due to a bug in the Android 15 emulator this function may have no effect. Try a physical device or an emulator with a different version of Android.
 *
 * @platform android
 */
export function setStyle(style: NavigationBarStyle) {
  console.warn('`setStyle` method is only available on Android');
}

/**
 * React hook that statefully updates with the visibility of the system navigation bar.
 *
 * @returns Visibility of the navigation bar, `null` during async initialization.
 *
 * @example
 * ```ts
 * function App() {
 *   const visibility = NavigationBar.useVisibility()
 *   // React Component...
 * }
 * ```
 */
export function useVisibility(): NavigationBarVisibility | null {
  const [visibility, setVisible] = useState<NavigationBarVisibility | null>(null);

  useEffect(() => {
    setVisible('hidden');
  }, []);

  return visibility;
}
