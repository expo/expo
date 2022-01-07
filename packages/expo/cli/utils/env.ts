import { boolish } from 'getenv';

/** Enable profiling metrics */
export const EXPO_PROFILE = boolish('EXPO_PROFILE', false);

/** Enable debug logging */
export const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

/** Is running in non-interactive CI mode */
export const CI = boolish('CI', false);
