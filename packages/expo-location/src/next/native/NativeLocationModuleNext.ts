import { UnavailabilityError, requireOptionalNativeModule } from 'expo';

import type { NativeLocationModuleNextClass } from './types/NativeLocationModuleNextClass.types';

const nativeModule =
  requireOptionalNativeModule<NativeLocationModuleNextClass>('LocationModuleNext');

export function getNativeLocationModuleNext(): NativeLocationModuleNextClass {
  if (!nativeModule) {
    throw new UnavailabilityError('expo-location/next', 'LocationModuleNext');
  }
  return nativeModule;
}
