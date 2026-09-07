import { NativeModule } from 'expo';
import type { SharedRef } from 'expo';

import type {
  GetPositionOptions,
  LocationPermissionResponse,
  LocationProviderRefType,
  Position,
  RequestPermissionsOptions,
} from '../../types';
import type { NativeLocationProviderClass } from './NativeLocationProviderClass.types';
import type { NativeLocationUpdatesHandleClass } from './NativeLocationUpdatesHandleClass.types';
import type { NativePositionWatchHandleClass } from './NativePositionWatchHandleClass.types';

export declare class NativeLocationModuleNextClass extends NativeModule {
  requestForegroundPermissions(
    options?: RequestPermissionsOptions
  ): Promise<LocationPermissionResponse>;
  getForegroundPermissions(): Promise<LocationPermissionResponse>;
  requestBackgroundPermissions(
    options?: RequestPermissionsOptions
  ): Promise<LocationPermissionResponse>;
  getBackgroundPermissions(): Promise<LocationPermissionResponse>;
  setLocationProvider(provider: SharedRef<LocationProviderRefType>): void;
  getSelectedLocationProviderName(): string;
  hasLocationServicesEnabled(): boolean;
  enableLocationServices(): Promise<boolean>;
  getPosition(options?: GetPositionOptions): Promise<Position | null>;
  LocationProvider: typeof NativeLocationProviderClass;
  PositionWatchHandle: typeof NativePositionWatchHandleClass;
  LocationUpdatesHandle: typeof NativeLocationUpdatesHandleClass;
}
