import { Platform, UnavailabilityError } from 'expo';

import { NativeLocationModuleNext } from '../native';
import type { Address, Coordinates, GeocodeOptions, ReverseGeocodeOptions } from '../types';

/**
 * Finds the places that match an address string. Requires a network connection.
 *
 * @param address The text to look up, for example, `1 Infinite Loop, Cupertino`.
 * @param options The language of the result.
 * @return A promise that resolves to the matching addresses, or to an empty array when there are none.
 * @throws When the device has no geocoding backend, geocoding is unavailable, or the request fails.
 * @example
 * ```ts
 * const [match] = await Location.geocode('1 Infinite Loop, Cupertino');
 * if (match) {
 *   console.log(match.coordinates.latitude, match.coordinates.longitude);
 * }
 * ```
 * @platform android
 * @platform ios
 */
export async function geocode(address: string, options?: GeocodeOptions): Promise<Address[]> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    throw new UnavailabilityError('expo-location', 'geocode');
  }
  return NativeLocationModuleNext.geocode(address, options);
}

/**
 * Finds the addresses at the given coordinates. Requires a network connection.
 *
 * @param coordinates The point to look up.
 * @param options The language of the result.
 * @return A promise that resolves to the addresses at the point, or to an empty array when there are none.
 * @throws When the coordinates are invalid, the device has no geocoding backend, geocoding is unavailable, or the request fails.
 * @example
 * ```ts
 * const position = await Location.getPosition();
 * if (position) {
 *   const [address] = await Location.reverseGeocode(position.coordinates);
 *   console.log(address?.formattedAddress);
 * }
 * ```
 * @platform android
 * @platform ios
 */
export async function reverseGeocode(
  coordinates: Coordinates,
  options?: ReverseGeocodeOptions
): Promise<Address[]> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    throw new UnavailabilityError('expo-location', 'reverseGeocode');
  }
  return NativeLocationModuleNext.reverseGeocode(coordinates, options);
}
