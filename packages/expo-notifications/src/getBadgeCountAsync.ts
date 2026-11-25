import { UnavailabilityError } from 'expo';

import BadgeModule from './BadgeModule';

/**
 * Gets the app icon's badge count:
 * - On Android, always returns `0`, regardless of visible badges. Android has no standard API for reading the launcher badge count.
 * - On iOS, returns the current badge count, or `0` if no badge is set.
 * - On web, returns the last count set in the current page, or `0` if none was set.
 * @return A Promise resolving to the badge count.
 * @header badge
 */
export async function getBadgeCountAsync(): Promise<number> {
  if (!BadgeModule.getBadgeCountAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getBadgeCountAsync');
  }

  return await BadgeModule.getBadgeCountAsync();
}
