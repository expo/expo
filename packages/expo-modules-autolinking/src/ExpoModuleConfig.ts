import {
  AndroidGradlePluginDescriptor,
  RawExpoModuleConfig,
  RawModuleConfigApple,
  SupportedPlatform,
} from './types';

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
    const supportedPlatforms = this.rawConfig.platforms ?? [];

    if (platform === 'apple') {
      // Apple platform is supported when any of iOS, macOS and tvOS is supported.
      return supportedPlatforms.some((supportedPlatform) => {
        return ['apple', 'ios', 'macos', 'tvos'].includes(supportedPlatform);
      });
    }
    return supportedPlatforms.includes(platform);
  }

  /**
   * Returns the generic config for all Apple platforms with a fallback to the legacy iOS config.
   */
  getAppleConfig(): RawModuleConfigApple | null {
    return this.rawConfig.apple ?? this.rawConfig.ios ?? null;
  }

  /**
   * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
   */
  appleModules() {
    const appleConfig = this.getAppleConfig();

    // `modulesClassNames` is a legacy name for the same config.
    return appleConfig?.modules ?? appleConfig?.modulesClassNames ?? [];
  }

  /**
   * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
   */
  appleAppDelegateSubscribers(): string[] {
    return this.getAppleConfig()?.appDelegateSubscribers ?? [];
  }

  /**
   * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
   */
  appleReactDelegateHandlers(): string[] {
    return this.getAppleConfig()?.reactDelegateHandlers ?? [];
  }

  /**
   * Returns podspec paths defined by the module author.
   */
  applePodspecPaths(): string[] {
    return arrayize(this.getAppleConfig()?.podspecPath);
  }

  /**
   * Returns the product module names, if defined by the module author.
   */
  appleSwiftModuleNames(): string[] {
    return arrayize(this.getAppleConfig()?.swiftModuleName);
  }

  /**
   * Returns whether this module will be added only to the debug configuration
   */
  appleDebugOnly(): boolean {
    return this.getAppleConfig()?.debugOnly ?? false;
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
