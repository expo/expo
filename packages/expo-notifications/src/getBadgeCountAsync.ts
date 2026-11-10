import { UnavailabilityError } from 'expo';

import BadgeModule from './BadgeModule';

/**
 * Gets the app icon's badge count. The result depends on the platform:
 * - On Android, always returns `0`. Android has no standard API for reading the launcher badge count.
 * This method does not count active notifications, and `0` does not mean that the launcher shows no badge.
 * - On iOS, returns the app icon's current badge count. A value of `0` means no badge is set.
 * - On web, returns the last count set with `setBadgeCountAsync` in the current page, or `0` if none was set.
 * It does not read the badge displayed by the browser or operating system.
 * @return A Promise resolving to the badge count described above.
 * @header badge
 */
export async function getBadgeCountAsync(): Promise<number> {
  if (!BadgeModule.getBadgeCountAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getBadgeCountAsync');
  }

  return await BadgeModule.getBadgeCountAsync();
}
