import { UnavailabilityError } from '@unimodules/core';
import { Platform } from 'react-native';
import { PermissionResponse, PermissionStatus } from 'unimodules-permissions-interface';

import ExpoTrackingTransparency from './ExpoTrackingTransparency';

const androidAndWebPermissionsResponse: PermissionResponse = {
  granted: true,
  expires: 'never',
  canAskAgain: true,
  status: PermissionStatus.GRANTED,
};

/**
 * Requests the user to authorize or deny access to app-related data that
 * can be used for tracking the user or the device. Examples of data used for tracking include
 * email address, device ID, advertising ID, etc.
 *
 * The system remembers the user’s choice and doesn’t prompt
 * again unless a user uninstalls and then reinstalls the app on the device.
 *
 * On Android and web, this method always returns that the permission was granted.
 * @example
 * ```typescript
 * const { granted } = await requestTrackingPermissionsAsync();
 *
 * if (granted) {
 *   // Your app is authorized to track the user or their device
 * }
 * ```
 */
export async function requestTrackingPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(androidAndWebPermissionsResponse);
  }

  if (!ExpoTrackingTransparency.requestPermissionsAsync) {
    throw new UnavailabilityError('TrackingTransparency', 'requestPermissionsAsync');
  }
  return await ExpoTrackingTransparency.requestPermissionsAsync();
}

/**
 * Checks whether or not the user has authorized the app to access app-related data that
 * can be used for tracking the user or the device. See `requestPermissionsAsync` for more
 * details.
 *
 * On Android and web, this method always returns that the permission was granted.
 *
 * @example
 * ```typescript
 * const { granted } = await getTrackingPermissionsAsync();
 *
 * if (granted) {
 *   // Your app is authorized to track the user or their device
 * }
 * ```
 */
export async function getTrackingPermissionsAsync(): Promise<PermissionResponse> {
  if (Platform.OS !== 'ios') {
    return Promise.resolve(androidAndWebPermissionsResponse);
  }

  if (!ExpoTrackingTransparency.getPermissionsAsync) {
    throw new UnavailabilityError('TrackingTransparency', 'getPermissionsAsync');
  }
  return await ExpoTrackingTransparency.getPermissionsAsync();
}

export { PermissionResponse };
