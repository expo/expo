import type { SharedRef } from 'expo';

import { NativeLocationModuleNext, NativeLocationProvider } from '../native';
import type { LocationProviderRefType } from '../types';

/**
 * Location provider is a backend to which expo-location delegates the location requests.
 * A `LocationProvider` interface is defined on Android and multiple implementations are exposed
 * as static methods in this class. The default tries Google Play services first and falls back to
 * the Android framework, so most apps never need this.
 *
 * @platform android
 */
export class LocationProvider {
  /**
   * The fused location provider from Google Play services. When the play services are absent, all calls throw.
   *
   * @platform android
   */
  static Gms(): SharedRef<LocationProviderRefType> {
    return NativeLocationProvider.Gms();
  }

  /**
   * The Android framework `LocationManager`, available without Google Play services.
   *
   * @platform android
   */
  static Android(): SharedRef<LocationProviderRefType> {
    return NativeLocationProvider.Android();
  }

  /**
   * Tries the providers in order and uses the first one that can serve the request.
   *
   * @param providers The providers to try, most preferred first.
   * @platform android
   */
  static Fallback(
    providers: SharedRef<LocationProviderRefType>[]
  ): SharedRef<LocationProviderRefType> {
    return NativeLocationProvider.Fallback(providers);
  }
}

/**
 * Selects the provider that serves all later location requests.
 *
 * @param provider A provider from `LocationProvider`.
 * @platform android
 */
export function setLocationProvider(provider: SharedRef<LocationProviderRefType>): void {
  NativeLocationModuleNext.setLocationProvider(provider);
}

/**
 * Gets the name of the provider currently serving positions: `GMS`, `Android`, or the chain of a
 * fallback, such as the default `Fallback: GMS -> Android`.
 *
 * @platform android
 */
export function getSelectedLocationProviderName(): string {
  return NativeLocationModuleNext.getSelectedLocationProviderName();
}
