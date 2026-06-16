import { validate, type JSONSchema } from '@expo/schema-utils';

/**
 * Type representing base dev launcher configuration.
 */
export type PluginConfigType = PluginConfigOptionsByPlatform & PluginConfigOptions;

/**
 * Type representing available configuration for each platform.
 */
export type PluginConfigOptionsByPlatform = {
  /**
   * Type representing available configuration for Android dev launcher.
   * @platform android
   */
  android?: PluginConfigOptions;
  /**
   * Type representing available configuration for iOS dev launcher.
   * @platform ios
   */
  ios?: PluginConfigOptions;
};

/**
 * Type representing available configuration for dev launcher.
 */
export type PluginConfigOptions = {
  /**
   * Determines whether to launch the most recently opened project or navigate to the launcher screen.
   *
   * - `'most-recent'` - Attempt to launch directly into a previously opened project and if unable to connect,
   * fall back to the launcher screen.
   *
   * - `'launcher'` - Opens the launcher screen.
   *
   * @default 'most-recent'
   */
  launchMode?: 'most-recent' | 'launcher';
  /**
   * @deprecated use the `launchMode` property instead
   */
  launchModeExperimental?: 'most-recent' | 'launcher';
  /**
   * A development server URL (for example `http://192.168.1.50:8081`) to bake into the build and
   * auto-connect to on launch, instead of waiting for the user to scan a QR code or pick a server.
   *
   * Useful for headless/CI/agent-driven workflows, or when running several Metro servers on fixed,
   * dedicated ports where the address is known ahead of build time. If the server is unreachable,
   * the dev launcher falls back to its home screen. A recently opened app still takes precedence
   * (unless `launchMode` is `'launcher'`).
   *
   * Can be overridden at build time with the `EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL` environment variable.
   */
  defaultServerUrl?: string;
};

const schema: JSONSchema<PluginConfigType> = {
  title: 'expo-dev-launcher',
  type: 'object',
  properties: {
    launchMode: {
      type: 'string',
      enum: ['most-recent', 'launcher'],
      nullable: true,
    },
    launchModeExperimental: {
      type: 'string',
      enum: ['most-recent', 'launcher'],
      nullable: true,
    },
    defaultServerUrl: {
      type: 'string',
      nullable: true,
    },
    android: {
      type: 'object',
      properties: {
        launchMode: {
          type: 'string',
          enum: ['most-recent', 'launcher'],
          nullable: true,
        },
        launchModeExperimental: {
          type: 'string',
          enum: ['most-recent', 'launcher'],
          nullable: true,
        },
        defaultServerUrl: {
          type: 'string',
          nullable: true,
        },
      },
      nullable: true,
    },
    ios: {
      type: 'object',
      properties: {
        launchMode: {
          type: 'string',
          enum: ['most-recent', 'launcher'],
          nullable: true,
        },
        launchModeExperimental: {
          type: 'string',
          enum: ['most-recent', 'launcher'],
          nullable: true,
        },
        defaultServerUrl: {
          type: 'string',
          nullable: true,
        },
      },
      nullable: true,
    },
  },
};

/**
 * @ignore
 */
export function validateConfig<T>(config: T): PluginConfigType {
  validate(schema, config);

  if (
    config.launchModeExperimental ||
    config.ios?.launchModeExperimental ||
    config.android?.launchModeExperimental
  ) {
    warnOnce(
      'The `launchModeExperimental` property of expo-dev-launcher config plugin is deprecated and will be removed in a future SDK release. Use `launchMode` instead.'
    );
  }

  return config;
}

const warnMap: Record<string, boolean> = {};
function warnOnce(message: string) {
  if (!warnMap[message]) {
    warnMap[message] = true;
    console.warn(message);
  }
}
