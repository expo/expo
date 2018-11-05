/**
 * @flow
 */

import { Amplitude, Constants } from 'expo';
import Environment from '../utils/Environment';
import { normalizeTrackingOptions } from './AnalyticsUtils';

const events = {
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_CREATED_ACCOUNT: 'USER_CREATED_ACCOUNT',
  USER_RESET_PASSWORD: 'USER_RESET_PASSWORD',
  USER_LINKED_SOCIAL: 'USER_LINKED_SOCIAL',
  USER_UPDATED_EMAIL: 'USER_UPDATED_EMAIL',
  USER_UPDATED_PROFILE: 'USER_UPDATED_PROFILE',
  USER_UPDATED_LINKS: 'USER_UPDATED_SOCIAL_LINKS',
  USER_UPDATED_LIKE: 'USER_UPDATED_LIKE',
  USER_UPDATED_PRIVACY: 'USER_UPDATED_PRIVACY',
  USER_REMOVED_PROJECT: 'USER_REMOVED_PROJECT',
  USER_OPENED_CREATION: 'USER_OPENED_CREATION',
  USER_UPDATED_SETTINGS: 'USER_UPDATED_SETTINGS',
};

let isInitialized = false;
const { manifest } = Constants;
const apiKey = manifest.extra && manifest.extra.amplitudeApiKey;
const initialize = () => {
  if (!Environment.isProduction || !apiKey) {
    return;
  }

  Amplitude.initialize(apiKey);
  isInitialized = true;
};

const maybeInitialize = () => {
  if (apiKey && !isInitialized) {
    initialize();
  }
};

const identify = (id: ?string, options?: ?Object = null) => {
  maybeInitialize();
  options = normalizeTrackingOptions(options);

  if (id) {
    Amplitude.setUserId(id);
    if (options) {
      Amplitude.setUserProperties(options);
    }
  } else {
    Amplitude.clearUserProperties();
  }
};

const track = (event: string, options: any = null) => {
  maybeInitialize();
  options = normalizeTrackingOptions(options);

  if (options) {
    Amplitude.logEventWithProperties(event, options);
  } else {
    Amplitude.logEvent(event);
  }
};

export default {
  events,
  track,
  identify,
};
