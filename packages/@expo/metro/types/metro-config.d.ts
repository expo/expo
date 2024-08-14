// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/index.js (entry point)
declare module '@expo/metro/metro-config' {
  export * from '@expo/metro/metro-config/configTypes';
  export * from '@expo/metro/metro-config/loadConfig';
  export { default as getDefaultConfig } from '@expo/metro/metro-config/defaults/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/loadConfig.js
declare module '@expo/metro/metro-config/configTypes' {
  export type {
    ConfigT,
    ExtraTransformOptions,
    GetTransformOptions,
    GetTransformOptionsOpts,
    InputConfigT,
    IntermediateConfigT,
    MetalConfigT,
    MetroConfig,
    Middleware,
    PerfAnnotations,
    PerfLogger,
    PerfLoggerFactory,
    PerfLoggerFactoryOptions,
    PerfLoggerPointOptions,
    ResolverConfigT,
    RootPerfLogger,
    SerializerConfigT,
    ServerConfigT,
    SymbolicatorConfigT,
    TransformerConfigT,
    WatcherConfigT,
    WatcherInputConfigT,
    YargArguments
  } from 'metro-config/src/configTypes';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/loadConfig.js
declare module '@expo/metro/metro-config/loadConfig' {
  export {
    type CosmiConfigResult,
    loadConfig,
    mergeConfig,
    resolveConfig,
  } from 'metro-config/src/loadConfig';
}

// #region /defaults/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/defaults/index.js
declare module '@expo/metro/metro-config/defaults/index' {
  export { default } from 'metro-config/src/defaults/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/defaults/defaults.js
declare module '@expo/metro/metro-config/defaults/defaults' {
  import { default as createModuleIdFactory } from '@expo/metro/metro/lib/createModuleIdFactory';
  import type { RootPerfLogger } from '@expo/metro/metro-config/configTypes';

  export const assetExts: string[];
  export const assetResolutions: string[];
  export const sourceExts: string[];
  export const additionalExts: string[];
  export const moduleSystem: string;
  export const platforms: string[];
  export const DEFAULT_METRO_MINIFIER_PATH: 'metro-minify-terser';
  export const defaultCreateModuleIdFactory: typeof createModuleIdFactory;
  export const noopPerfLoggerFactory: RootPerfLogger;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/defaults/exclusionList.js
declare module '@expo/metro/metro-config/defaults/exclusionList' {
  export default function exclusionList(additionalExclusions: (string | RegExp)[]): RegExp;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-config/src/defaults/validConfig.js
// declare module '@expo/metro/metro-config/defaults/validConfig' {}
// NOTE(cedric): this file seems to be used for testing or internal purposes
