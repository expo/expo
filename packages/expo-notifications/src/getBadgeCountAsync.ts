import { UnavailabilityError } from 'expo';

import BadgeModule from './BadgeModule';

/**
 * Fetches the number currently set as the badge of the app icon on device's home screen. On iOS and web, a `0` value means that the badge is not displayed.
 * > **Note:** On Android, this method always resolves to `0`. Android manages badges based on active notifications and does not expose the launcher badge count.
 * @return Returns a Promise resolving to a number that represents the current badge of the app icon.
 * @header badge
 */
export async function getBadgeCountAsync(): Promise<number> {
  if (!BadgeModule.getBadgeCountAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getBadgeCountAsync');
  }

  return await BadgeModule.getBadgeCountAsync();
}
