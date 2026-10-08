import { NativeLocationModuleNext } from '../native';
import type { GetPositionOptions, Position } from '../types';

/**
 * Resolves with a single fix. It returns a cached fix when one is younger than `maxCachedAge`.
 * Otherwise, it waits up to `timeout` seconds for a new one and falls back to the last known
 * location when none arrives. With `timeout` `0`, it returns the last known location right away.
 * Check `timestamp` when freshness matters.
 *
 * @param getPositionOptions The options for the location request.
 * @return A promise that resolves to the position, or `null` when the device has none.
 * @throws When the foreground permission is not granted, or when location services are off (iOS).
 * @example
 * ```ts
 * const position = await Location.getPosition({ maxCachedAge: 60, timeout: 10 });
 * if (!position) {
 *   console.log('No location available');
 *   return;
 * }
 * const ageSeconds = (Date.now() - position.timestamp) / 1000;
 * if (ageSeconds > 60) {
 *   console.log(
 *     `Last known location from ${Math.round(ageSeconds)} s ago, no fresh fix within the timeout`
 *   );
 * }
 * console.log(position.coordinates.latitude, position.coordinates.longitude);
 * ```
 */
export async function getPosition(
  getPositionOptions?: GetPositionOptions
): Promise<Position | null> {
  return NativeLocationModuleNext.getPosition(getPositionOptions);
}
