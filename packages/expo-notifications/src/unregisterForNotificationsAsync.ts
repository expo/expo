import { UnavailabilityError } from 'expo-modules-core';

import PushTokenManager from './PushTokenManager';

// @docsMissing
export default async function unregisterForNotificationsAsync(): Promise<void> {
  if (!PushTokenManager.unregisterForNotificationsAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'unregisterForNotificationsAsync');
  }
  return PushTokenManager.unregisterForNotificationsAsync();
}
