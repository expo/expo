import { boolish } from 'getenv';

class Env {
  /** Enable image utils related debugging messages */
  get EXPO_IMAGE_UTILS_DEBUG() {
    return boolish('EXPO_IMAGE_UTILS_DEBUG', false);
  }

  /** Disable all Sharp related functionality. */
  get EXPO_IMAGE_UTILS_NO_SHARP() {
    return boolish('EXPO_IMAGE_UTILS_NO_SHARP', false);
  }
}

export const env = new Env();
