import { ExpoModuleConfig } from './ExpoModuleConfig';

export type SupportedPlatform = 'ios' | 'android' | 'web';

export interface SearchOptions {
  // Available in the CLI
  searchPaths: string[];
  ignorePaths?: string[] | null;
  exclude?: string[] | null;
  platform: SupportedPlatform;
  silent?: boolean;

  // Scratched from project's config
  flags?: Record<string, any>;
}

export interface ResolveOptions extends SearchOptions {
  json?: boolean;
}

export interface GenerateOptions extends ResolveOptions {
  target: string;
  namespace?: string;
  empty?: boolean;
}

export type PackageRevision = {
  path: string;
  version: string;
  config?: ExpoModuleConfig;
  duplicates?: PackageRevision[];
};

export type SearchResults = {
  [moduleName: string]: PackageRevision;
};

export type ModuleDescriptorAndroid = Record<string, any>;
export interface ModuleDescriptorIos {
  pods: { podName: string; podspecDir: string }[];
  flags: Record<string, any> | undefined;
  modulesClassNames: string[];
  appDelegateSubscribers: string[];
}

export type ModuleDescriptor = ModuleDescriptorAndroid | ModuleDescriptorIos;

/**
 * Represents a raw config from `expo-module.json`.
 */
export interface RawExpoModuleConfig {
  /**
   * An array of supported platforms.
   */
  platforms?: SupportedPlatform[];

  /**
   * iOS-specific config.
   */
  ios?: {
    /**
     * Names of Swift native modules classes to put to the generated modules provider file.
     */
    modulesClassNames?: string[];

    /**
     * Names of Swift classes that hooks into `ExpoAppDelegate` to receive AppDelegate life-cycle events.
     */
    appDelegateSubscribers?: string[];
  };

  /**
   * Android-specific config.
   */
  android?: {
    /**
     * Full names (package + class name) of Kotlin native modules classes to put to the generated package provider file.
     */
    modulesClassNames?: string[];
  };
}
