import { boolish, int, string } from 'getenv';

class Env {
  /** Directory containing transforms restored from a previous build. Used when EXPO_METRO_CACHE_OUTPUT_DIR is also set. */
  get EXPO_METRO_CACHE_RESTORE_DIR(): string {
    return string('EXPO_METRO_CACHE_RESTORE_DIR', '');
  }

  /** Directory for Metro transform cache reads and writes. With EXPO_METRO_CACHE_RESTORE_DIR, collects transforms used by this build. */
  get EXPO_METRO_CACHE_OUTPUT_DIR(): string {
    return string('EXPO_METRO_CACHE_OUTPUT_DIR', '');
  }

  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** The React Metro port that's baked into react-native scripts and tools. */
  get RCT_METRO_PORT() {
    return int('RCT_METRO_PORT', 8081);
  }

  /** Disable Environment Variable injection in client bundles. */
  get EXPO_NO_CLIENT_ENV_VARS(): boolean {
    return boolish('EXPO_NO_CLIENT_ENV_VARS', false);
  }

  /** Enable the use of Expo's custom metro require implementation. The custom require supports better debugging, tree shaking, and React Server Components. */
  get EXPO_USE_METRO_REQUIRE() {
    return boolish('EXPO_USE_METRO_REQUIRE', false);
  }
}

export const env = new Env();
