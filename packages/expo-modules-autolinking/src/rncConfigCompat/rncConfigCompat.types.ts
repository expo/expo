import type { SupportedPlatform } from '../types';

/**
 * Options for 'rnc-config-compat' command.
 */
export interface RncConfigCompatOptions {
  platform: SupportedPlatform;
  projectRoot: string;
  searchPaths: string[];
}

/**
 * Dependency configuration for Android platform.
 */
export interface RncConfigCompatDependencyConfigAndroid {
  sourceDir: string;
  packageImportPath: string;
  packageInstance: string;
  dependencyConfiguration?: string;
  buildTypes: string[];
  libraryName?: string | null;
  componentDescriptors?: string[] | null;
  cmakeListsPath?: string | null;
  cxxModuleCMakeListsModuleName?: string | null;
  cxxModuleCMakeListsPath?: string | null;
  cxxModuleHeaderName?: string | null;
}

/**
 * Dependency configuration for iOS platform.
 */
export interface RncConfigCompatDependencyConfigIos {
  podspecPath: string;
  version: string;
  configurations: string[];
  scriptPhases: any[];
}

/**
 * Dependency configuration.
 */
export interface RncConfigCompatDependencyConfig {
  root: string;
  name: string;
  platforms: {
    android?: RncConfigCompatDependencyConfigAndroid;
    ios?: RncConfigCompatDependencyConfigIos;
  };
}

/**
 * Result of 'rnc-config-compat' command.
 */
export interface RncConfigCompatResult {
  root: string;
  reactNativePath: string;
  dependencies: Record<string, RncConfigCompatDependencyConfig>;
  project: {
    ios?: {
      sourceDir: string;
    };
  };
}

export type RncConfigCompatReactNativePlatformsConfigAndroid = any;
export type RncConfigCompatReactNativePlatformsConfigIos = any;

interface RncConfigCompatReactNativePlatformsConfig {
  platforms?: {
    android?: RncConfigCompatReactNativePlatformsConfigAndroid;
    ios?: RncConfigCompatReactNativePlatformsConfigIos;
  };
}

/**
 * The `react-native.config.js` config from projectRoot.
 */
export interface RncConfigCompatReactNativeProjectConfig {
  dependencies: Record<string, RncConfigCompatReactNativePlatformsConfig>;
}

/**
 * The `react-native.config.js` config from library packageRoot.
 */
export interface RncConfigCompatReactNativeLibraryConfig {
  dependency?: RncConfigCompatReactNativePlatformsConfig;
  platforms?: any;
}

export type RncConfigCompatReactNativeConfig =
  | RncConfigCompatReactNativeProjectConfig
  | RncConfigCompatReactNativeLibraryConfig;
