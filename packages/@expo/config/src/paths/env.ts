import { boolish, string } from 'getenv';

class Env {
  /** Disable auto server root detection for Metro. This will not change the server root to the workspace root. */
  get EXPO_NO_METRO_WORKSPACE_ROOT(): boolean {
    if (string('EXPO_USE_METRO_WORKSPACE_ROOT', '')) {
      console.warn(
        'EXPO_USE_METRO_WORKSPACE_ROOT is enabled by default, use EXPO_NO_METRO_WORKSPACE_ROOT instead to disable.'
      );
    }

    return boolish('EXPO_NO_METRO_WORKSPACE_ROOT', false);
  }
}

export const env = new Env();
