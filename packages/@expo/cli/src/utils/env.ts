import { boolish, int, string } from 'getenv';

// @expo/webpack-config -> expo-pwa -> @expo/image-utils: EXPO_IMAGE_UTILS_NO_SHARP

// TODO: EXPO_CLI_USERNAME, EXPO_CLI_PASSWORD

class Env {
  /** Is running in non-interactive CI mode */
  get CI() {
    return boolish('CI', false);
  }
  /** Enable profiling metrics */
  get EXPO_PROFILE() {
    return boolish('EXPO_PROFILE', false);
  }

  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** Enable the beta version of Expo (TODO: Should this just be in the beta version of expo releases?) */
  get EXPO_BETA() {
    return boolish('EXPO_BETA', false);
  }

  /** Enable staging API environment */
  get EXPO_STAGING() {
    return boolish('EXPO_STAGING', false);
  }

  /** Enable local API environment */
  get EXPO_LOCAL() {
    return boolish('EXPO_LOCAL', false);
  }

  /** Disable telemetry (analytics) */
  get EXPO_NO_TELEMETRY() {
    return boolish('EXPO_NO_TELEMETRY', false);
  }

  /** local directory to the universe repo for testing locally */
  get EXPO_UNIVERSE_DIR() {
    return string('EXPO_UNIVERSE_DIR', '');
  }

  /** @deprecated Default Webpack host string */
  get WEB_HOST() {
    return string('WEB_HOST', '0.0.0.0');
  }

  /** Skip warning users about a dirty git status */
  get EXPO_NO_GIT_STATUS() {
    return boolish('EXPO_NO_GIT_STATUS', false);
  }
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
  /** Enable the experimental interstitial app select page. */
  get EXPO_ENABLE_INTERSTITIAL_PAGE() {
    return boolish('EXPO_ENABLE_INTERSTITIAL_PAGE', false);
  }
  /** The React Metro port that's baked into react-native scripts and tools. */
  get RCT_METRO_PORT() {
    return int('RCT_METRO_PORT', 0);
  }
}

export const env = new Env();
