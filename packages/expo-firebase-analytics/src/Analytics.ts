import { UnavailabilityError } from '@unimodules/core';

import ExpoFirebaseAnalytics from './ExpoFirebaseAnalytics';

export async function initAppAsync(config: { [key: string]: any }): Promise<void> {
  // @ts-ignore
  if (global.__DEV__ !== true) {
    console.warn('initAppAsync should only be used in dev mode');
  }
  if (!ExpoFirebaseAnalytics.initAppAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'initAppAsync');
  }
  return await ExpoFirebaseAnalytics.initAppAsync(config);
}

export async function deleteAppAsync(config: { [key: string]: any }): Promise<void> {
  if (!ExpoFirebaseAnalytics.deleteAppAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'deleteAppAsync');
  }
  return await ExpoFirebaseAnalytics.deleteAppAsync(config);
}

/*** Firebase */

export async function logEventAsync(
  name: string,
  properties?: { [key: string]: any }
): Promise<void> {
  if (!ExpoFirebaseAnalytics.logEventAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'logEventAsync');
  }
  return await ExpoFirebaseAnalytics.logEventAsync(name, properties);
}
export async function setAnalyticsCollectionEnabledAsync(isEnabled: boolean): Promise<void> {
  if (!ExpoFirebaseAnalytics.setAnalyticsCollectionEnabledAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setAnalyticsCollectionEnabledAsync');
  }
  return await ExpoFirebaseAnalytics.setAnalyticsCollectionEnabledAsync(isEnabled);
}
export async function setCurrentScreenAsync(
  screenName: string,
  screenClassOverride?: string
): Promise<void> {
  if (!ExpoFirebaseAnalytics.setCurrentScreenAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setCurrentScreenAsync');
  }
  return await ExpoFirebaseAnalytics.setCurrentScreenAsync(screenName, screenClassOverride);
}
export async function setMinimumSessionDurationAsync(millis: number): Promise<void> {
  if (!ExpoFirebaseAnalytics.setMinimumSessionDurationAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setMinimumSessionDurationAsync');
  }
  return await ExpoFirebaseAnalytics.setMinimumSessionDurationAsync(millis);
}
export async function setSessionTimeoutDurationAsync(millis: number): Promise<void> {
  if (!ExpoFirebaseAnalytics.setSessionTimeoutDurationAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setSessionTimeoutDurationAsync');
  }
  return await ExpoFirebaseAnalytics.setSessionTimeoutDurationAsync(millis);
}
export async function setUserIdAsync(userId: string): Promise<void> {
  if (!ExpoFirebaseAnalytics.setUserIdAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setUserIdAsync');
  }
  return await ExpoFirebaseAnalytics.setUserIdAsync(userId);
}
export async function setUserPropertyAsync(
  name: string,
  value?: { [key: string]: any }
): Promise<void> {
  if (!ExpoFirebaseAnalytics.setUserPropertyAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setUserPropertyAsync');
  }
  return await ExpoFirebaseAnalytics.setUserPropertyAsync(name, value);
}
export async function setUserPropertiesAsync(properties: { [key: string]: any }): Promise<void> {
  if (!ExpoFirebaseAnalytics.setUserPropertiesAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'setUserPropertiesAsync');
  }
  return await ExpoFirebaseAnalytics.setUserPropertiesAsync(properties);
}
export async function resetAnalyticsDataAsync(): Promise<void> {
  if (!ExpoFirebaseAnalytics.resetAnalyticsDataAsync) {
    throw new UnavailabilityError('expo-firebase-analytics', 'resetAnalyticsDataAsync');
  }
  return await ExpoFirebaseAnalytics.resetAnalyticsDataAsync();
}
