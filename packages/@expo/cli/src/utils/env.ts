import { boolish, int, string } from 'getenv';

// @expo/webpack-config -> expo-pwa -> @expo/image-utils: EXPO_IMAGE_UTILS_NO_SHARP

// TODO: EXPO_CLI_USERNAME, EXPO_CLI_PASSWORD

class Env {
  /** Enable profiling metrics */
  get EXPO_PROFILE() {
    return boolish('EXPO_PROFILE', false);
  }

  /** Enable debug logging */
  get EXPO_DEBUG() {
    return boolish('EXPO_DEBUG', false);
  }

  /** Enable the beta version of Expo (TODO: Should this just be in the beta version of expo releases?) */
  get EXPO_BETA() {
    return boolish('EXPO_BETA', false);
  }

  /** Enable staging API environment */
  get EXPO_STAGING() {
    return boolish('EXPO_STAGING', false);
  }

  /** Enable local API environment */
  get EXPO_LOCAL() {
    return boolish('EXPO_LOCAL', false);
  }

  /** Is running in non-interactive CI mode */
  get CI() {
    return boolish('CI', false);
  }

  /** Disable telemetry (analytics) */
  get EXPO_NO_TELEMETRY() {
    return boolish('EXPO_NO_TELEMETRY', false);
  }

  /** local directory to the universe repo for testing locally */
  get EXPO_UNIVERSE_DIR() {
    return string('EXPO_UNIVERSE_DIR', '');
  }

  /** @deprecated Default Webpack host string */
  get WEB_HOST() {
    return string('WEB_HOST', '0.0.0.0');
  }

  /** Skip warning users about a dirty git status */
  get EXPO_NO_GIT_STATUS() {
    return boolish('EXPO_NO_GIT_STATUS', false);
  }
  /** Disable auto web setup */
  get EXPO_NO_WEB_SETUP() {
    return boolish('EXPO_NO_WEB_SETUP', false);
  }
  /** Disable auto TypeScript setup */
  get EXPO_NO_TYPESCRIPT_SETUP() {
    return boolish('EXPO_NO_TYPESCRIPT_SETUP', false);
  }
  /** Disable all API caches. Does not disable bundler caches. */
  get EXPO_NO_CACHE() {
    return boolish('EXPO_NO_CACHE', false);
  }
  /** Disable the app select redirect page. */
  get EXPO_NO_REDIRECT_PAGE() {
    return boolish('EXPO_NO_REDIRECT_PAGE', false);
  }
  /** The React Metro port that's baked into react-native scripts and tools. */
  get RCT_METRO_PORT() {
    return int('RCT_METRO_PORT', 0);
  }
  /** Skip validating the manifest during `export`. */
  get EXPO_SKIP_MANIFEST_VALIDATION_TOKEN(): boolean {
    return !!string('EXPO_SKIP_MANIFEST_VALIDATION_TOKEN');
  }

  /** Public folder path relative to the project root. Default to `public` */
  get EXPO_PUBLIC_FOLDER(): string {
    return string('EXPO_PUBLIC_FOLDER', 'public');
  }

  /** Higher priority `$EDIOTR` variable for indicating which editor to use when pressing `o` in the Terminal UI. */
  get EXPO_EDITOR(): string {
    return string('EXPO_EDITOR', '');
  }

  /**
   * Overwrite the dev server URL, disregarding the `--port`, `--host`, `--tunnel`, `--lan`, `--localhost` arguments.
   * This is useful for browser editors that require custom proxy URLs.
   *
   * The URL will not be used verbatim unless `EXPO_NO_DEFAULT_PORT=true` is also set,
   * otherwise a `:80` port will be added for Android support.
   */
  get EXPO_PACKAGER_PROXY_URL(): string {
    return string('EXPO_PACKAGER_PROXY_URL', '');
  }

  /**
   * Disable the enforced `:80` port when using custom dev server URLs.
   * This can break the incomplete Android WebSocket implementation but allows
   * `EXPO_PACKAGER_PROXY_URL` to work as expected.
   * */
  get EXPO_NO_DEFAULT_PORT(): boolean {
    return boolish('EXPO_NO_DEFAULT_PORT', false);
  }
}

export const env = new Env();
