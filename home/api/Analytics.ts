import * as Amplitude from 'expo-analytics-amplitude';
import Constants from 'expo-constants';

import Environment from '../utils/Environment';
import { TrackingOptions, normalizeTrackingOptions } from './AnalyticsUtils';

let isInitialized = false;
const apiKey = Constants.manifest?.extra?.amplitudeApiKey;

export const events = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_CREATED_ACCOUNT: 'USER_CREATED_ACCOUNT',
};

const canUseAmplitude = Environment.isProduction && apiKey;

export async function initialize(): Promise<void> {
  if (isInitialized || !canUseAmplitude) {
    return;
  }

  await Amplitude.initializeAsync(apiKey);
  isInitialized = true;
}

export async function identify(id: string | null, options?: TrackingOptions): Promise<void> {
  initialize();
  const properties = normalizeTrackingOptions(options);

  if (!canUseAmplitude) return;
  if (id) {
    await Amplitude.setUserIdAsync(id);
    if (properties) {
      await Amplitude.setUserPropertiesAsync(properties);
    }
  } else {
    await Amplitude.clearUserPropertiesAsync();
  }
}

export async function track(event: string, options?: TrackingOptions): Promise<void> {
  initialize();
  const properties = normalizeTrackingOptions(options);

  if (!canUseAmplitude) return;

  if (properties) {
    await Amplitude.logEventWithPropertiesAsync(event, properties);
  } else {
    await Amplitude.logEventAsync(event);
  }
}

export default {
  events,
  initialize,
  identify,
  track,
};
