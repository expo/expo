// #region metro-core
declare module 'metro-core' {
  export * from 'metro-core/private/index';
  export { default } from 'metro-core/private/index';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/canonicalize.js
declare module 'metro-core/private/canonicalize' {
  function canonicalize(key: string, value: any): any;
  export default canonicalize;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/errors.js
declare module 'metro-core/private/errors' {
  export { default as AmbiguousModuleResolutionError } from 'metro-core/private/errors/AmbiguousModuleResolutionError';
  export { default as PackageResolutionError } from 'metro-core/private/errors/PackageResolutionError';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/errors/AmbiguousModuleResolutionError.js
declare module 'metro-core/private/errors/AmbiguousModuleResolutionError' {
  import type { DuplicateHasteCandidatesError } from 'metro-file-map';
  class AmbiguousModuleResolutionError extends Error {
    fromModulePath: string;
    hasteError: DuplicateHasteCandidatesError;
    constructor(fromModulePath: string, hasteError: DuplicateHasteCandidatesError);
  }
  export default AmbiguousModuleResolutionError;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/errors/PackageResolutionError.js
declare module 'metro-core/private/errors/PackageResolutionError' {
  import type { InvalidPackageError } from 'metro-resolver';
  class PackageResolutionError extends Error {
    originModulePath: string;
    packageError: InvalidPackageError;
    targetModuleName: string;
    constructor(opts: {
      readonly originModulePath: string;
      readonly packageError: InvalidPackageError;
      readonly targetModuleName: string;
    });
  }
  export default PackageResolutionError;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/index.js
declare module 'metro-core/private/index' {
  export { default as AmbiguousModuleResolutionError } from 'metro-core/private/errors/AmbiguousModuleResolutionError';
  export { default as Logger } from 'metro-core/private/Logger';
  export { default as PackageResolutionError } from 'metro-core/private/errors/PackageResolutionError';
  export { default as Terminal } from 'metro-core/private/Terminal';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/Logger.js
declare module 'metro-core/private/Logger' {
  import type { BundleOptions } from 'metro/private/shared/types.flow';
  export type ActionLogEntryData = {
    action_name: string;
    log_entry_label?: string;
  };
  export type ActionStartLogEntry = {
    action_name?: string;
    action_phase?: string;
    log_entry_label: string;
    log_session?: string;
    start_timestamp?: [number, number];
  };
  export type LogEntry = {
    action_name?: string;
    action_phase?: string;
    action_result?: string;
    duration_ms?: number;
    entry_point?: string;
    file_name?: string;
    log_entry_label: string;
    log_session?: string;
    start_timestamp?: [number, number];
    outdated_modules?: number;
    bundle_size?: number;
    bundle_options?: BundleOptions;
    bundle_hash?: string;
    build_id?: string;
    error_message?: string;
    error_stack?: string;
  };
  export function on(event: string, handler: (logEntry: LogEntry) => void): void;
  export function createEntry(data: LogEntry | string): LogEntry;
  export function createActionStartEntry(data: ActionLogEntryData | string): LogEntry;
  export function createActionEndEntry(
    logEntry: ActionStartLogEntry,
    error?: null | undefined | Error
  ): LogEntry;
  export function log(logEntry: LogEntry): LogEntry;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-core/src/Terminal.js
declare module 'metro-core/private/Terminal' {
  import type * as _nodeStream from 'node:stream';
  import type * as _nodeNet from 'node:net';
  import tty from 'node:tty';
  type UnderlyingStream = _nodeNet.Socket | _nodeStream.Writable;
  /**
   * We don't just print things to the console, sometimes we also want to show
   * and update progress. This utility just ensures the output stays neat: no
   * missing newlines, no mangled log lines.
   *
   *     const terminal = Terminal.default;
   *     terminal.status('Updating... 38%');
   *     terminal.log('warning: Something happened.');
   *     terminal.status('Updating, done.');
   *     terminal.persistStatus();
   *
   * The final output:
   *
   *     warning: Something happened.
   *     Updating, done.
   *
   * Without the status feature, we may get a mangled output:
   *
   *     Updating... 38%warning: Something happened.
   *     Updating, done.
   *
   * This is meant to be user-readable and TTY-oriented. We use stdout by default
   * because it's more about status information than diagnostics/errors (stderr).
   *
   * Do not add any higher-level functionality in this class such as "warning" and
   * "error" printers, as it is not meant for formatting/reporting. It has the
   * single responsibility of handling status messages.
   */
  class Terminal {
    _logLines: string[];
    _nextStatusStr: string;
    _statusStr: string;
    _stream: UnderlyingStream;
    _ttyStream: null | undefined | tty.WriteStream;
    _updatePromise: Promise<void> | null;
    _isUpdating: boolean;
    _isPendingUpdate: boolean;
    _shouldFlush: boolean;
    _writeStatusThrottled: ($$PARAM_0$$: string) => void;
    constructor(
      stream: UnderlyingStream,
      $$PARAM_1$$: {
        ttyPrint?: boolean;
      }
    );
    _scheduleUpdate(): void;
    waitForUpdates(): Promise<void>;
    flush(): Promise<void>;
    _update(): Promise<void>;
    status(format: string, ...args: any[]): string;
    log(format: string, ...args: any[]): void;
    persistStatus(): void;
  }
  export default Terminal;
}
