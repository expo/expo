import type { SharedRef } from 'expo';

import { NativeLocationModuleNext, NativeLocationProvider } from '../native';
import type { LocationProviderRefType } from '../types';

export class LocationProvider {
  static Gms(): SharedRef<LocationProviderRefType> {
    return NativeLocationProvider.Gms();
  }

  static Android(): SharedRef<LocationProviderRefType> {
    return NativeLocationProvider.Android();
  }

  static Fallback(
    providers: SharedRef<LocationProviderRefType>[]
  ): SharedRef<LocationProviderRefType> {
    return NativeLocationProvider.Fallback(providers);
  }
}

export function setLocationProvider(provider: SharedRef<LocationProviderRefType>): void {
  NativeLocationModuleNext.setLocationProvider(provider);
}

export function getSelectedLocationProviderName(): string {
  return NativeLocationModuleNext.getSelectedLocationProviderName();
}
