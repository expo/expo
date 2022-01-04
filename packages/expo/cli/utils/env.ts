import { boolish } from 'getenv';

export const EXPO_NO_GIT_STATUS = boolish('EXPO_NO_GIT_STATUS', false);

export const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

export const EXPO_PROFILE = boolish('EXPO_PROFILE', false);

// import program from 'commander';

export function isNonInteractive() {
  // TODO: Implement this
  return false;
}
