import * as Amplitude from 'expo-analytics-amplitude';
import Constants from 'expo-constants';

import Environment from '../utils/Environment';
import { TrackingOptions, normalizeTrackingOptions } from './AnalyticsUtils';

let isInitialized = false;
const { manifest } = Constants;
const apiKey = manifest.extra && manifest.extra.amplitudeApiKey;

export const events = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_CREATED_ACCOUNT: 'USER_CREATED_ACCOUNT',
  USER_RESET_PASSWORD: 'USER_RESET_PASSWORD',
  USER_LINKED_SOCIAL: 'USER_LINKED_SOCIAL',
  USER_UPDATED_EMAIL: 'USER_UPDATED_EMAIL',
  USER_UPDATED_PROFILE: 'USER_UPDATED_PROFILE',
  USER_UPDATED_LINKS: 'USER_UPDATED_SOCIAL_LINKS',
  USER_UPDATED_PRIVACY: 'USER_UPDATED_PRIVACY',
  USER_REMOVED_PROJECT: 'USER_REMOVED_PROJECT',
  USER_OPENED_CREATION: 'USER_OPENED_CREATION',
  USER_UPDATED_SETTINGS: 'USER_UPDATED_SETTINGS',
};

export function initialize(): void {
  if (isInitialized || !Environment.isProduction || !apiKey) {
    return;
  }

  Amplitude.initialize(apiKey);
  isInitialized = true;
}

export function identify(id: string | null, options?: TrackingOptions) {
  initialize();
  const properties = normalizeTrackingOptions(options);

  if (id) {
    Amplitude.setUserId(id);
    if (properties) {
      Amplitude.setUserProperties(properties);
    }
  } else {
    Amplitude.clearUserProperties();
  }
}

export function track(event: string, options?: TrackingOptions): void {
  initialize();
  const properties = normalizeTrackingOptions(options);

  if (properties) {
    Amplitude.logEventWithProperties(event, properties);
  } else {
    Amplitude.logEvent(event);
  }
}

export default {
  events,
  initialize,
  identify,
  track,
};
