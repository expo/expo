import { boolish } from 'getenv';

export const EXPO_NO_GIT_STATUS = boolish('EXPO_NO_GIT_STATUS', false);

/** Enable profiling metrics */
export const EXPO_PROFILE = boolish('EXPO_PROFILE', false);

/** Enable debug logging */
export const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

/** Enable staging API environment */
export const EXPO_STAGING = boolish('EXPO_STAGING', false);

/** Enable local API environment */
export const EXPO_LOCAL = boolish('EXPO_LOCAL', false);

/** Is running in non-interactive CI mode */
export const CI = boolish('CI', false);

/** Disable telemetry (analytics) */
export const EXPO_NO_TELEMETRY = boolish('EXPO_NO_TELEMETRY', false);
