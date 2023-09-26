import Ajv, { JSONSchemaType } from 'ajv';

/**
 * Interface representing base dev launcher configuration.
 */
export interface PluginConfigType {
  /**
   * Interface representing available configuration for Android dev launcher.
   * @platform android
   */
  android?: PluginConfigTypeAndroid;
  /**
   * Interface representing available configuration for iOS dev launcher.
   * @platform ios
   */
  ios?: PluginConfigTypeIos;
}

/**
 * Interface representing available configuration for Android dev launcher.
 * @platform android
 */
export interface PluginConfigTypeAndroid {
  /**
   * Attempts to launch directly into a previously opened project. If unable to connect,
   * fall back to the launcher screen.
   */
  tryToLaunchLastOpenedBundle?: boolean;
}

/**
 * Interface representing available configuration for iOS dev launcher.
 * @platform ios
 */
export interface PluginConfigTypeIos {
  /**
   * Attempts to launch directly into a previously opened project. If unable to connect,
   * fall back to the launcher screen.
   */
  tryToLaunchLastOpenedBundle?: boolean;
}

const schema: JSONSchemaType<PluginConfigType> = {
  type: 'object',
  properties: {
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
