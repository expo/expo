import { boolish } from 'getenv';

class Env {
  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }
  /** Enable the beta version of Expo (TODO: Should this just be in the beta version of expo releases?) */
  get EXPO_BETA() {
    return boolish('EXPO_BETA', false);
  }
  /** Is running in non-interactive CI mode */
  get CI() {
    return boolish('CI', false);
  }
  /** Disable all API caches. Does not disable bundler caches. */
  get EXPO_NO_CACHE() {
    return boolish('EXPO_NO_CACHE', false);
  }
  /** Disable telemetry (analytics) */
  get EXPO_NO_TELEMETRY() {
    return boolish('EXPO_NO_TELEMETRY', false);
  }
  /** Enable profiling. Set to '1' for table output, 'json' for machine-readable JSON. */
  get CREATE_EXPO_PROFILE(): string {
    return process.env.CREATE_EXPO_PROFILE ?? '';
  }
}

export const env = new Env();
