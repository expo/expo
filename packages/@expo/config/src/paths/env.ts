import { boolish } from 'getenv';

class Env {
  /** Disable auto server root detection for Metro. This will not change the server root to the workspace root. */
  get EXPO_NO_METRO_WORKSPACE_ROOT(): boolean {
    return boolish('EXPO_NO_METRO_WORKSPACE_ROOT', false);
  }
}

export const env = new Env();
