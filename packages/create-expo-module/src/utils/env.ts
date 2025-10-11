import { boolish } from 'getenv';

export const env = {
  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  },
  /** Enable the beta version of the Expo module template */
  get EXPO_BETA() {
    return boolish('EXPO_BETA', false);
  },
  /** Disable telemetry (analytics) */
  get EXPO_NO_TELEMETRY() {
    return boolish('EXPO_NO_TELEMETRY', false);
  },
  /** Enable the staging environment of Expo, mostly for telemetry */
  get EXPO_STAGING() {
    return boolish('EXPO_STAGING', false);
  },
  /** Enable the local environment of Expo, mostly for telemetry */
  get EXPO_LOCAL() {
    return boolish('EXPO_LOCAL', false);
  },
};
