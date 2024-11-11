import { boolish } from 'getenv';

class Env {
  /** Enable image utils related debugging messages */
  get EXPO_IMAGE_UTILS_DEBUG() {
    return boolish('EXPO_IMAGE_UTILS_DEBUG', false);
  }

  /** Disable all Sharp related functionality. */
  get EXPO_IMAGE_UTILS_NO_SHARP() {
    // note(brentvatne): Default to disabled until we can invest further in
    // fixing it: https://github.com/expo/expo/issues/32625.
    return boolish('EXPO_IMAGE_UTILS_NO_SHARP', true);
  }
}

export const env = new Env();
