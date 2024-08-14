// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/index.js (entry point)
declare module '@expo/metro/metro-core' {
  export { Terminal, type UnderlyingStream } from '@expo/metro/metro-core/Terminal';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/Logger.js
declare module '@expo/metro/metro-core/Logger' {
  import type { BundleOptions } from '@expo/metro/metro/shared/types';

  export type ActionLogEntryData = {
    action_name: string;
    log_entry_label?: string;
    [key: string]: any; // ...
  };

  export type ActionStartLogEntry = {
    action_name?: string;
    action_phase?: string;
    log_entry_label: string;
    log_session?: string;
    start_timestamp?: [number, number];
    [key: string]: any; // ...
  };

  export type LogEntry = {
    action_name?: string;
    action_phase?: string;
    duration_ms?: number;
    entry_point?: string;
    log_entry_label: string;
    log_session?: string;
    start_timestamp?: [number, number];
    outdated_modules?: number;
    bundle_size?: number;
    bundle_options?: BundleOptions;
    bundle_hash?: string;
    build_id?: string;
    [key: string]: any; // ...
  };

  export function on(event: string, handler: (entry: LogEntry) => void): void;
  export function createEntry(data: LogEntry | string): LogEntry;
  export function createActionStartEntry(data: ActionLogEntryData | string): LogEntry;
  export function createActionEndEntry(entry: ActionStartLogEntry): LogEntry;
  export function log(entry: LogEntry): LogEntry;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/Terminal.js
declare module '@expo/metro/metro-core/Terminal' {
  export { Terminal, type UnderlyingStream } from 'metro-core/src/Terminal';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/canonicalize.js
declare module '@expo/metro/metro-core/canonicalize' {
  export default function canonicalize(key: string, value: any): any;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/errors.js
declare module '@expo/metro/metro-core/errors' {
  export { default as AmbiguousModuleResolutionError } from '@expo/metro/metro-core/errors/AmbiguousModuleResolutionError';
  export { default as PackageResolutionError } from '@expo/metro/metro-core/errors/PackageResolutionError';
}

// #region /errors/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/errors/AmbiguousModuleResolutionError.js
declare module '@expo/metro/metro-core/errors/AmbiguousModuleResolutionError' {
  import type { DuplicateHasteCandidatesError } from '@expo/metro/metro-file-map';

  export default class AmbiguousModuleResolutionError extends Error {
    fromModulePath: string;
    hasteError: DuplicateHasteCandidatesError;
    constructor(fromModulePath: string, hasteError: DuplicateHasteCandidatesError);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-core/src/errors/PackageResolutionError.js
declare module '@expo/metro/metro-core/errors/PackageResolutionError' {
  import type { InvalidPackageError } from '@expo/metro/metro-resolver';

  export default class PackageResolutionError extends Error {
    originModulePath: string;
    packageError: InvalidPackageError;
    targetModuleName: string;

    constructor(options: {
      originModulePath: string;
      packageError: InvalidPackageError;
      targetModuleName: string;
    });
  }
}
