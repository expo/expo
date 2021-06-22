import { RawExpoModuleConfig, SupportedPlatform } from './types';

/**
 * A class that wraps the raw config (`expo-module.json` or `unimodule.json`).
 */
export class ExpoModuleConfig {
  constructor(readonly rawConfig: RawExpoModuleConfig) {}

  /**
   * Whether the module supports given platform.
   */
  supportsPlatform(platform: SupportedPlatform): boolean {
    return this.rawConfig.platforms?.includes(platform) ?? false;
  }

  /**
   * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
   */
  iosModulesClassNames() {
    return this.rawConfig.ios?.modulesClassNames ?? [];
  }

  /**
   * Returns serializable raw config.
   */
  toJSON(): RawExpoModuleConfig {
    return this.rawConfig;
  }
}

/**
 * Reads the config at given path and returns the config wrapped by `ExpoModuleConfig` class.
 */
export function requireAndResolveExpoModuleConfig(path: string): ExpoModuleConfig {
  // TODO: Validate the raw config against a schema.
  // TODO: Support for `*.js` files, not only static `*.json`.
  return new ExpoModuleConfig(require(path) as RawExpoModuleConfig);
}
