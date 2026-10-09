import { Platform, UnavailabilityError } from 'expo';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { NativeLocationModuleNext } from '../native';

/**
 * Checks whether location services are turned on for the whole device. This is the system toggle,
 * not the app's permission: with services off, no app receives a position even when its permission
 * is granted.
 * See [Handle location services turned off](#handle-location-services-turned-off).
 */
export function hasLocationServicesEnabled(): boolean {
  return NativeLocationModuleNext.hasLocationServicesEnabled();
}

/**
 * Asks the user to turn location services on. With the GMS provider, this is an in-app dialog; with
 * the Android provider, it opens the system Settings and resolves when the user returns. Resolves
 * with `true` when services are already on.
 * See [Handle location services turned off](#handle-location-services-turned-off).
 *
 * @return A promise that resolves to `true` when services are on after the user answered.
 * @platform android
 */
export async function enableLocationServices(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    throw new UnavailabilityError('expo-location', 'enableLocationServices');
  }

  return NativeLocationModuleNext.enableLocationServices();
}

/**
 * Tracks whether location services are on, re-reading the switch every time the app returns to the
 * foreground. `enable` calls `enableLocationServices`, so it works on Android only.
 * See [Handle location services turned off](#handle-location-services-turned-off).
 *
 * @example
 * ```tsx
 * const [enabled, enable] = useLocationServices();
 *
 * if (!enabled) {
 *   return <Button title="Turn on location services" onPress={enable} />;
 * }
 * ```
 */
export function useLocationServices(): [enabled: boolean, enable: () => Promise<boolean>] {
  const [enabled, setEnabled] = useState(hasLocationServicesEnabled);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setEnabled(hasLocationServicesEnabled());
      }
    });
    return () => subscription.remove();
  }, []);

  const enable = useCallback(async () => {
    const result = await enableLocationServices();
    setEnabled(result);
    return result;
  }, []);

  return [enabled, enable];
}
