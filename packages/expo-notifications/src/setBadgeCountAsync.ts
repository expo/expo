import { UnavailabilityError, Platform } from '@unimodules/core';

import BadgeModule from './BadgeModule';
import { SetBadgeCountOptions } from './BadgeModule.types';

export default async function setBadgeCountAsync(
  badgeCount: number,
  options?: SetBadgeCountOptions
): Promise<boolean> {
  if (!BadgeModule.setBadgeCountAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'setBadgeCountAsync');
  }

  return await BadgeModule.setBadgeCountAsync(badgeCount, options?.[Platform.OS]);
}
