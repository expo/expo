import Ajv, { JSONSchemaType } from 'ajv';

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
};

const schema: JSONSchemaType<PluginConfigType> = {
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
      },
      nullable: true,
    },
  },
};

/**
 * @ignore
 */
export function validateConfig<T>(config: T): PluginConfigType {
  const validate = new Ajv({ allowUnionTypes: true }).compile(schema);
  if (!validate(config)) {
    throw new Error('Invalid expo-dev-launcher config: ' + JSON.stringify(validate.errors));
  }

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
