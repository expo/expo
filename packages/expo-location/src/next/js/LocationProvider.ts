import type { SharedRef } from 'expo';

import { getNativeLocationModuleNext } from '../native';
import type { LocationProviderRefType } from '../types';

export class LocationProvider {
  static Gms(): SharedRef<LocationProviderRefType> {
    return getNativeLocationModuleNext().LocationProvider.Gms();
  }

  static Android(): SharedRef<LocationProviderRefType> {
    return getNativeLocationModuleNext().LocationProvider.Android();
  }

  static Fallback(
    providers: SharedRef<LocationProviderRefType>[]
  ): SharedRef<LocationProviderRefType> {
    return getNativeLocationModuleNext().LocationProvider.Fallback(providers);
  }
}

export function setLocationProvider(provider: SharedRef<LocationProviderRefType>): void {
  getNativeLocationModuleNext().setLocationProvider(provider);
}

export function getSelectedLocationProviderName(): string {
  return getNativeLocationModuleNext().getSelectedLocationProviderName();
}
