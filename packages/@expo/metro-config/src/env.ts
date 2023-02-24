import { boolish, int } from 'getenv';

class Env {
  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** Prevent disabling the `x_facebook_sources` non-standard sourcemap extension when `EXPO_USE_EXOTIC` is enabled. */
  get EXPO_USE_FB_SOURCES() {
    return boolish('EXPO_USE_FB_SOURCES', false);
  }

  /** Enable the experimental "exotic" mode. [Learn more](https://blog.expo.dev/drastically-faster-bundling-in-react-native-a54f268e0ed1). */
  get EXPO_USE_EXOTIC() {
    return boolish('EXPO_USE_EXOTIC', false);
  }

  /** The React Metro port that's baked into react-native scripts and tools. */
  get RCT_METRO_PORT() {
    return int('RCT_METRO_PORT', 8081);
  }

  /** Enable auto server root detection for Metro. This will change the server root to the workspace root. */
  get EXPO_USE_METRO_WORKSPACE_ROOT(): boolean {
    return boolish('EXPO_USE_METRO_WORKSPACE_ROOT', false);
  }
}

export const env = new Env();
