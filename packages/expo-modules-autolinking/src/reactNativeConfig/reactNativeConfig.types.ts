import type { SupportedPlatform } from '../types';

/**
 * Options for 'react-native-config' command.
 */
export interface RNConfigCommandOptions {
  platform: SupportedPlatform;
  projectRoot: string;
  searchPaths?: string[];
  transitiveLinkingDependencies: string[];
  sourceDir?: string;
  // NOTE(@kitten): This was missing before. The options utils are very imprecisely defined. Sometimes some options
  // are defined but not used, and in this case this was missing
  nativeModulesDir?: string | null;
  /** Only scan direct "dependencies" of a project for React Native modules, rather than including transitive dependencies.
   * @remarks
   * Before SDK 54, React Native modules would only be linked if they were listed as dependencies
   * of a project. However, in SDK 54+ transitive React Native modules dependencies are also
   * auto-linked, unless this flag is enabled.
   * @privateRemarks
   * This is not an argument, but can only be specified on `expo.autolinking`
   */
  legacy_shallowReactNativeLinking?: boolean;
}

/**
 * Dependency configuration for Android platform.
 */
export interface RNConfigDependencyAndroid {
  sourceDir: string;
  packageImportPath: string | null;
  packageInstance: string | null;
  dependencyConfiguration?: string;
  buildTypes: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  cmakeListsPath?: string | null;
  cxxModuleCMakeListsModuleName?: string | null;
  cxxModuleCMakeListsPath?: string | null;
  cxxModuleHeaderName?: string | null;
  isPureCxxDependency?: boolean;
}

/**
 * Dependency configuration for iOS platform.
 */
export interface RNConfigDependencyIos {
  podspecPath: string;
  version: string;
  configurations: string[];
  scriptPhases: any[];
}

/**
 * Dependency configuration.
 */
export interface RNConfigDependency {
  root: string;
  name: string;
  platforms: {
    android?: RNConfigDependencyAndroid;
    ios?: RNConfigDependencyIos;
  };
}

/**
 * Result of 'react-native-config' command.
 */
export interface RNConfigResult {
  root: string;
  reactNativePath: string;
  dependencies: Record<string, RNConfigDependency>;
  project: {
    ios?: {
      sourceDir: string;
    };
  };
}

export type RNConfigReactNativePlatformsConfigAndroid = any;
export type RNConfigReactNativePlatformsConfigIos = any;

interface RNConfigReactNativePlatformsConfig {
  root?: string;
  platforms?: {
    android?: RNConfigReactNativePlatformsConfigAndroid;
    ios?: RNConfigReactNativePlatformsConfigIos;
  };
}

/**
 * The `react-native.config.js` config from projectRoot.
 */
export interface RNConfigReactNativeProjectConfig {
  dependencies?: Record<string, RNConfigReactNativePlatformsConfig>;
}

/**
 * The `react-native.config.js` config from library packageRoot.
 */
export interface RNConfigReactNativeLibraryConfig {
  dependency?: RNConfigReactNativePlatformsConfig;
  platforms?: any;
}

export type RNConfigReactNativeConfig =
  | RNConfigReactNativeProjectConfig
  | RNConfigReactNativeLibraryConfig;

/**
 * The `project` config represents the app project configuration.
 */
export interface RNConfigReactNativeAppProjectConfig {
  android?: {
    sourceDir: string;
    packageName: string;
  };
  ios?: {
    sourceDir: string;
  };
}
