import { Platform, UnavailabilityError } from 'expo';
import { useCallback, useState } from 'react';

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

  const enable = useCallback(async () => {
    const result = await enableLocationServices();
    setEnabled(result);
    return result;
  }, []);

  return [enabled, enable];
}
