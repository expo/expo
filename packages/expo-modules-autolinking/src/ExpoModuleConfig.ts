import fs from 'fs';
import path from 'path';

import {
  AndroidGradleAarProjectDescriptor,
  AndroidGradlePluginDescriptor,
  AndroidPublication,
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

export class ExpoAndroidProjectConfig {
  constructor(
    public name: string,
    public path: string,
    public modules?: string[],
    public publication?: AndroidPublication,
    public gradleAarProjects?: AndroidGradleAarProjectDescriptor[],
    public shouldUsePublicationScriptPath?: string,
    /**
     * Whether this project is the root one.
     */
    public isDefault: boolean = false
  ) {}
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

    if (platform === 'web') {
      // Web platform is implicitly supported for autolinking resolution but has no special behavior
      return true;
    } else if (platform === 'apple') {
      // Apple platform is supported when any of iOS, macOS and tvOS is supported.
      return supportedPlatforms.some((supportedPlatform) => {
        return ['apple', 'ios', 'macos', 'tvos'].includes(supportedPlatform);
      });
    }
    switch (platform) {
      case 'ios':
      case 'macos':
      case 'tvos':
        // ios|macos|tvos are supported when the module supports "apple" as a platform in general
        return supportedPlatforms.includes(platform) || supportedPlatforms.includes('apple');
      default:
        return supportedPlatforms.includes(platform);
    }
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
    return appleConfig?.modules ?? [];
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
   * Returns information about Android projects defined by the module author.
   */
  androidProjects(defaultProjectName: string): ExpoAndroidProjectConfig[] {
    const androidProjects: ExpoAndroidProjectConfig[] = [];

    // Adding the "root" Android project - it might not be valide.
    androidProjects.push(
      new ExpoAndroidProjectConfig(
        this.rawConfig.android?.name ?? defaultProjectName,
        this.rawConfig.android?.path ?? 'android',
        this.rawConfig.android?.modules,
        this.rawConfig.android?.publication,
        this.rawConfig.android?.gradleAarProjects,
        this.rawConfig.android?.shouldUsePublicationScriptPath,
        !this.rawConfig.android?.path // it's default project because path is not defined
      )
    );

    this.rawConfig.android?.projects?.forEach((project) => {
      androidProjects.push(
        new ExpoAndroidProjectConfig(
          project.name,
          project.path,
          project.modules,
          project.publication,
          project.gradleAarProjects,
          project.shouldUsePublicationScriptPath
        )
      );
    });

    return androidProjects;
  }

  /**
   * Returns gradle plugins descriptors defined by the module author.
   */
  androidGradlePlugins(): AndroidGradlePluginDescriptor[] {
    return arrayize(this.rawConfig.android?.gradlePlugins ?? []);
  }

  /**
   * Returns gradle projects containing AAR files defined by the module author.
   */
  androidGradleAarProjects(): AndroidGradleAarProjectDescriptor[] {
    return arrayize(this.rawConfig.android?.gradleAarProjects ?? []);
  }

  /**
   * Returns the publication config for Android.
   */
  androidPublication(): AndroidPublication | undefined {
    return this.rawConfig.android?.publication;
  }

  /**
   * Returns core features required by the module author.
   */
  coreFeatures(): string[] {
    return arrayize(this.rawConfig.coreFeatures ?? []);
  }

  /**
   * Returns serializable raw config.
   */
  toJSON(): RawExpoModuleConfig {
    return this.rawConfig;
  }
}

/** Names of Expo Module config files (highest to lowest priority) */
const EXPO_MODULE_CONFIG_FILENAMES = ['expo-module.config.json', 'unimodule.json'];

export async function discoverExpoModuleConfigAsync(
  directoryPath: string
): Promise<ExpoModuleConfig | null> {
  for (let idx = 0; idx < EXPO_MODULE_CONFIG_FILENAMES.length; idx++) {
    // TODO: Validate the raw config against a schema.
    // TODO: Support for `*.js` files, not only static `*.json`.
    const targetPath = path.join(directoryPath, EXPO_MODULE_CONFIG_FILENAMES[idx]);
    let text: string;
    try {
      text = await fs.promises.readFile(targetPath, 'utf8');
    } catch {
      // try the next file
      continue;
    }
    return new ExpoModuleConfig(JSON.parse(text) as RawExpoModuleConfig);
  }
  return null;
}
