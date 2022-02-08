import { boolish, string, int } from 'getenv';

/** Skip warning users about a dirty git status */
export const EXPO_NO_GIT_STATUS = boolish('EXPO_NO_GIT_STATUS', false);

/** Enable profiling metrics */
export const EXPO_PROFILE = boolish('EXPO_PROFILE', false);

/** Enable debug logging */
export const EXPO_DEBUG = boolish('EXPO_DEBUG', false);

/** Enable the beta version of Expo (TODO: Should this just be in the beta version of expo releases?) */
export const EXPO_BETA = boolish('EXPO_BETA', false);

/** Enable staging API environment */
export const EXPO_STAGING = boolish('EXPO_STAGING', false);

/** Enable local API environment */
export const EXPO_LOCAL = boolish('EXPO_LOCAL', false);

/** Is running in non-interactive CI mode */
export const CI = boolish('CI', false);

/** Disable auto web setup */
export const EXPO_NO_WEB_SETUP = () => boolish('EXPO_NO_WEB_SETUP', false);

/** Disable auto TypeScript setup */
export const EXPO_NO_TYPESCRIPT_SETUP = () => boolish('EXPO_NO_TYPESCRIPT_SETUP', false);

/** Disable telemetry (analytics) */
export const EXPO_NO_TELEMETRY = boolish('EXPO_NO_TELEMETRY', false);

/** Is running in non-interactive CI mode */
export const LOCAL_XDL_SCHEMA = boolish('LOCAL_XDL_SCHEMA', false);

/** local directory to the universe repo for testing locally */
export const EXPO_UNIVERSE_DIR = string('EXPO_UNIVERSE_DIR', '');

// TODO: Rename to EXPO_API_PORT or something...
export const XDL_PORT = int('XDL_PORT', 0);

/** Defaults to `exp.host` */
export const XDL_HOST = string('XDL_HOST', 'exp.host');

export const XDL_SCHEME = string('XDL_SCHEME', 'https');

/** @deprecated Default Webpack host string */
export const WEB_HOST = string('WEB_HOST', '0.0.0.0');

/** @deprecated Default Webpack port string */
export const WEB_PORT = int('WEB_PORT', 19006);

// @expo/webpack-config -> expo-pwa -> @expo/image-utils: EXPO_IMAGE_UTILS_NO_SHARP

// TODO: EXPO_CLI_USERNAME, EXPO_CLI_PASSWORD

/** Expo automated authentication token for use in CI environments */
export const EXPO_TOKEN = process.env.EXPO_TOKEN ?? null;

/** Disable all API caches. Does not disable bundler caches. */
export const EXPO_NO_CACHE = () => boolish('EXPO_NO_CACHE', false);

// @expo/webpack-config -> expo-pwa -> @expo/image-utils: EXPO_IMAGE_UTILS_NO_SHARP

// TODO: EXPO_CLI_USERNAME, EXPO_CLI_PASSWORD
