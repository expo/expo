import { boolish, int } from 'getenv';

class Env {
  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** Enable the experimental "exotic" mode. [Learn more](https://blog.expo.dev/drastically-faster-bundling-in-react-native-a54f268e0ed1). */
  get EXPO_USE_EXOTIC() {
    return boolish('EXPO_USE_EXOTIC', false);
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

  /** Enable the deprecated `serializer.getModulesRunBeforeMainModule` system which injects polyfill modules before running the main module. This has been removed in favor of simply importing the required polyfills in the `expo` module. */
  get EXPO_USE_DEPRECATED_POLYFILL_SORTING() {
    return boolish('EXPO_USE_DEPRECATED_POLYFILL_SORTING', false);
  }
}

export const env = new Env();
