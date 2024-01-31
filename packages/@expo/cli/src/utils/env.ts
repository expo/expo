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

  /** Disable all network requests */
  get EXPO_OFFLINE() {
    return boolish('EXPO_OFFLINE', false);
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
    return !!string('EXPO_SKIP_MANIFEST_VALIDATION_TOKEN', '');
  }

  /** Public folder path relative to the project root. Default to `public` */
  get EXPO_PUBLIC_FOLDER(): string {
    return string('EXPO_PUBLIC_FOLDER', 'public');
  }

  /** Higher priority `$EDIOTR` variable for indicating which editor to use when pressing `o` in the Terminal UI. */
  get EXPO_EDITOR(): string {
    return string('EXPO_EDITOR', '');
  }

  /** Enable auto server root detection for Metro. This will change the server root to the workspace root. */
  get EXPO_USE_METRO_WORKSPACE_ROOT(): boolean {
    return boolish('EXPO_USE_METRO_WORKSPACE_ROOT', false);
  }

  /**
   * Overwrite the dev server URL, disregarding the `--port`, `--host`, `--tunnel`, `--lan`, `--localhost` arguments.
   * This is useful for browser editors that require custom proxy URLs.
   */
  get EXPO_PACKAGER_PROXY_URL(): string {
    return string('EXPO_PACKAGER_PROXY_URL', '');
  }

  /**
   * **Experimental** - Disable using `exp.direct` as the hostname for
   * `--tunnel` connections. This enables **https://** forwarding which
   * can be used to test universal links on iOS.
   *
   * This may cause issues with `expo-linking` and Expo Go.
   *
   * Select the exact subdomain by passing a string value that is not one of: `true`, `false`, `1`, `0`.
   */
  get EXPO_TUNNEL_SUBDOMAIN(): string | boolean {
    const subdomain = string('EXPO_TUNNEL_SUBDOMAIN', '');
    if (['0', 'false', ''].includes(subdomain)) {
      return false;
    } else if (['1', 'true'].includes(subdomain)) {
      return true;
    }
    return subdomain;
  }

  /**
   * Force Expo CLI to use the [`resolver.resolverMainFields`](https://facebook.github.io/metro/docs/configuration/#resolvermainfields) from the project `metro.config.js` for all platforms.
   *
   * By default, Expo CLI will use `['browser', 'module', 'main']` (default for Webpack) for web and the user-defined main fields for other platforms.
   */
  get EXPO_METRO_NO_MAIN_FIELD_OVERRIDE(): boolean {
    return boolish('EXPO_METRO_NO_MAIN_FIELD_OVERRIDE', false);
  }

  /**
   * HTTP/HTTPS proxy to connect to for network requests. Configures [https-proxy-agent](https://www.npmjs.com/package/https-proxy-agent).
   */
  get HTTP_PROXY(): string {
    return process.env.HTTP_PROXY || process.env.http_proxy || '';
  }

  /**
   * Use the network inspector by overriding the metro inspector proxy with a custom version.
   * @deprecated This has been replaced by `@react-native/dev-middleware` and is now unused.
   */
  get EXPO_NO_INSPECTOR_PROXY(): boolean {
    return boolish('EXPO_NO_INSPECTOR_PROXY', false);
  }

  /** Disable lazy bundling in Metro bundler. */
  get EXPO_NO_METRO_LAZY() {
    return boolish('EXPO_NO_METRO_LAZY', false);
  }

  /** Enable the unstable inverse dependency stack trace for Metro bundling errors. */
  get EXPO_METRO_UNSTABLE_ERRORS() {
    return boolish('EXPO_METRO_UNSTABLE_ERRORS', false);
  }

  /** Enable the unstable fast resolver for Metro. */
  get EXPO_USE_FAST_RESOLVER() {
    return boolish('EXPO_USE_FAST_RESOLVER', false);
  }

  /** Disable Environment Variable injection in client bundles. */
  get EXPO_NO_CLIENT_ENV_VARS(): boolean {
    return boolish('EXPO_NO_CLIENT_ENV_VARS', false);
  }

  /** Enable the React Native JS Inspector, instead of the "classic" Chrome DevTools (SDK <=49) */
  get EXPO_USE_UNSTABLE_DEBUGGER(): boolean {
    return boolish('EXPO_USE_UNSTABLE_DEBUGGER', false);
  }

  /** Set the default `user` that should be passed to `--user` with ADB commands. Used for installing APKs on Android devices with multiple profiles. Defaults to `0`. */
  get EXPO_ADB_USER(): string {
    return string('EXPO_ADB_USER', '0');
  }
}

export const env = new Env();
