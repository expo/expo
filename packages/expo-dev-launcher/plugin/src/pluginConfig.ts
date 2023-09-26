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
   * Attempts to launch directly into a previously opened project. If unable to connect,
   * fall back to the launcher screen.
   */
  tryToLaunchLastOpenedBundle?: boolean;
};

const schema: JSONSchemaType<PluginConfigType> = {
  type: 'object',
  properties: {
    tryToLaunchLastOpenedBundle: { type: 'boolean', nullable: true },
    android: {
      type: 'object',
      properties: {
        tryToLaunchLastOpenedBundle: { type: 'boolean', nullable: true },
      },
      nullable: true,
    },
    ios: {
      type: 'object',
      properties: {
        tryToLaunchLastOpenedBundle: { type: 'boolean', nullable: true },
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

  return config;
}
