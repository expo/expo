import { EXPO_LOCAL, EXPO_STAGING, XDL_HOST, XDL_PORT, XDL_SCHEME } from '../../utils/env';

interface ApiConfig {
  scheme: string;
  host: string;
  port: number | null;
}

interface ProcessSettings {
  /** API endpoints to use. */
  api: ApiConfig;
  /** Name of this tool. */
  developerTool: 'expo-cli';
  /** Should the CLI skip making network requests. */
  isOffline: boolean;
  /** Should the dev server use `https` protocol. */
  https: boolean;
  /** Should start the dev servers in development mode (minify). */
  isDevMode: boolean;
  /** Is dev client enabled. */
  devClient: boolean;
  /** Should run dev servers with clean caches. */
  resetDevServer: boolean;
  /** Which manifest handler to use. */
  forceManifestType: 'expo-updates' | 'classic';
  /** URL scheme to use when opening apps in custom runtimes. */
  scheme: string | null;
  /** Type of dev server host to use. */
  hostType: 'localhost' | 'lan' | 'tunnel';
  /** Lan type to use in the dev server. */
  lanType: 'ip' | 'hostname';
  /** Should instruct the bundler to create minified bundles. */
  minify: boolean;
  /** Max amount of workers (threads) to use with Metro bundler, defaults to undefined for max workers. */
  maxMetroWorkers?: number;
}

// TODO: Combine with endpoint.ts
function getAPI(): ApiConfig {
  if (EXPO_LOCAL) {
    return {
      scheme: 'http',
      host: 'localhost',
      port: 3000,
    };
  } else if (EXPO_STAGING) {
    return {
      scheme: XDL_SCHEME,
      host: 'staging.exp.host',
      port: XDL_PORT || null,
    };
  } else {
    return {
      scheme: XDL_SCHEME,
      host: XDL_HOST,
      port: XDL_PORT || null,
    };
  }
}

const settings: ProcessSettings = {
  api: getAPI(),
  developerTool: 'expo-cli',
  isOffline: false,
  https: false,
  devClient: false,
  isDevMode: true,
  resetDevServer: false,
  forceManifestType: 'classic',
  scheme: null,
  hostType: 'lan',
  lanType: 'ip',
  minify: false,
  maxMetroWorkers: undefined,
};

export default settings;
