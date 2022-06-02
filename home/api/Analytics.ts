import * as Amplitude from 'expo-analytics-amplitude';
import Constants from 'expo-constants';

import Environment from '../utils/Environment';
import { TrackingOptions, normalizeTrackingOptions } from './AnalyticsUtils';

let isInitialized = false;
const apiKey = Constants.manifest?.extra?.amplitudeApiKey;

const events = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_CREATED_ACCOUNT: 'USER_CREATED_ACCOUNT',
  USER_DELETED_ACCOUNT: 'USER_DELETED_ACCOUNT',
};

const canUseAmplitude = Environment.isProduction && apiKey;

async function initialize(): Promise<void> {
  if (isInitialized || !canUseAmplitude) {
    return;
  }

  await Amplitude.initializeAsync(apiKey);
  isInitialized = true;
}

async function identify(id: string | null, options?: TrackingOptions): Promise<void> {
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

async function track(event: string, options?: TrackingOptions): Promise<void> {
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
