import { UnavailabilityError, Platform } from 'expo-modules-core';

import BadgeModule from './BadgeModule';
import { WebSetBadgeCountOptions } from './BadgeModule.types';

export interface SetBadgeCountOptions {
  web?: WebSetBadgeCountOptions;
}

export default async function setBadgeCountAsync(
  badgeCount: number,
  options?: SetBadgeCountOptions
): Promise<boolean> {
  if (!BadgeModule.setBadgeCountAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'setBadgeCountAsync');
  }

  return await BadgeModule.setBadgeCountAsync(badgeCount, options?.[Platform.OS]);
}
