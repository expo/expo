import { requireNativeModule } from 'expo';

import type { NativeLocationModuleNextClass } from './types/NativeLocationModuleNextClass.types';

export const NativeLocationModuleNext =
  requireNativeModule<NativeLocationModuleNextClass>('ExpoLocationNext');
export const NativeLocationProvider = NativeLocationModuleNext.LocationProvider;
export const NativePositionWatchHandle = NativeLocationModuleNext.PositionWatchHandle;
export const NativeLocationUpdatesHandle = NativeLocationModuleNext.LocationUpdatesHandle;
