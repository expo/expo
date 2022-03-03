import { boolish, string } from 'getenv';

/** Skip warning users about a dirty git status */
export const EXPO_NO_GIT_STATUS = boolish('EXPO_NO_GIT_STATUS', false);

/** Enable profiling metrics */
export const EXPO_PROFILE = boolish('EXPO_PROFILE', false);

/** Enable debug logging */
export const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

/** Enable the beta version of Expo (TODO: Should this just be in the beta version of expo releases?) */
export const EXPO_BETA = boolish('EXPO_BETA', false);

/** Enable staging API environment */
export const EXPO_STAGING = boolish('EXPO_STAGING', false);

/** Enable local API environment */
export const EXPO_LOCAL = boolish('EXPO_LOCAL', false);

/** Is running in non-interactive CI mode */
export const CI = boolish('CI', false);

/** Disable telemetry (analytics) */
export const EXPO_NO_TELEMETRY = boolish('EXPO_NO_TELEMETRY', false);

/** Local directory to the universe repo for testing Expo schemas locally */
export const EXPO_UNIVERSE_DIR = string('EXPO_UNIVERSE_DIR', '');

/** Expo automated authentication token for use in CI environments */
export const EXPO_TOKEN = process.env.EXPO_TOKEN ?? null;

// @expo/webpack-config -> expo-pwa -> @expo/image-utils: EXPO_IMAGE_UTILS_NO_SHARP

// TODO: EXPO_CLI_USERNAME, EXPO_CLI_PASSWORD

class Env {
  /** Disable auto web setup */
  get EXPO_NO_WEB_SETUP() {
    return boolish('EXPO_NO_WEB_SETUP', false);
  }
  /** Disable auto TypeScript setup */
  get EXPO_NO_TYPESCRIPT_SETUP() {
    return boolish('EXPO_NO_TYPESCRIPT_SETUP', false);
  }
  /** Disable all API caches. Does not disable bundler caches. */
  get EXPO_NO_CACHE() {
    return boolish('EXPO_NO_CACHE', false);
  }
}

export const env = new Env();
