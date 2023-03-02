import { AndroidGradlePluginDescriptor, RawExpoModuleConfig, SupportedPlatform } from './types';

function arrayize<T>(value: T[] | T | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value != null ? [value] : [];
}

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
  iosModules() {
    const iosConfig = this.rawConfig.ios;

    // `modulesClassNames` is a legacy name for the same config.
    return iosConfig?.modules ?? iosConfig?.modulesClassNames ?? [];
  }

  /**
   * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
   */
  iosAppDelegateSubscribers(): string[] {
    return this.rawConfig.ios?.appDelegateSubscribers ?? [];
  }

  /**
   * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
   */
  iosReactDelegateHandlers(): string[] {
    return this.rawConfig.ios?.reactDelegateHandlers ?? [];
  }

  /**
   * Returns podspec paths defined by the module author.
   */
  iosPodspecPaths(): string[] {
    return arrayize(this.rawConfig.ios?.podspecPath);
  }

  /**
   * Returns the product module names, if defined by the module author.
   */
  iosSwiftModuleNames(): string[] {
    return arrayize(this.rawConfig.ios?.swiftModuleName);
  }

  /**
   * Returns whether this module will be added only to the debug configuration
   */
  iosDebugOnly(): boolean {
    return this.rawConfig.ios?.debugOnly ?? false;
  }

  /**
   * Returns a list of names of Kotlin native modules classes to put to the generated package provider file.
   */
  androidModules() {
    const androidConfig = this.rawConfig.android;

    // `modulesClassNames` is a legacy name for the same config.
    return androidConfig?.modules ?? androidConfig?.modulesClassNames ?? [];
  }

  /**
   * Returns build.gradle file paths defined by the module author.
   */
  androidGradlePaths(): string[] {
    return arrayize(this.rawConfig.android?.gradlePath ?? []);
  }

  /**
   * Returns gradle plugins descriptors defined by the module author.
   */
  androidGradlePlugins(): AndroidGradlePluginDescriptor[] {
    return arrayize(this.rawConfig.android?.gradlePlugins ?? []);
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
