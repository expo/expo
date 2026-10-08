import { Platform, UnavailabilityError } from 'expo';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { NativeLocationModuleNext } from '../native';

export function hasLocationServicesEnabled(): boolean {
  return NativeLocationModuleNext.hasLocationServicesEnabled();
}

export async function enableLocationServices(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    throw new UnavailabilityError('expo-location', 'enableLocationServices');
  }

  return NativeLocationModuleNext.enableLocationServices();
}

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
