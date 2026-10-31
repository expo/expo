/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Augments `@types/fb-watchman` with the types Metro declares for it in
// `flow-typed/fb-watchman.js`, so that modules can import them from
// 'fb-watchman' as their Flow sources do.
import type {} from 'fb-watchman';

declare module 'fb-watchman' {
  export type WatchmanBaseResponse = Readonly<{
    version: string;
    clock: string;
  }>;

  export type WatchmanClockResponse = WatchmanBaseResponse &
    Readonly<{
      warning?: string;
    }>;

  export type WatchmanSubscribeResponse = WatchmanBaseResponse &
    Readonly<{
      subscribe: string;
      warning?: string;
      'asserted-states'?: readonly string[];
    }>;

  export type WatchmanWatchResponse = WatchmanBaseResponse &
    Readonly<{
      watch: string;
      watcher: string;
      relative_path: string;
      warning?: string;
    }>;

  export type WatchmanWatchListResponse = WatchmanBaseResponse &
    Readonly<{
      roots: readonly string[];
    }>;

  export type WatchmanSubscriptionEvent = {
    subscription: string;
    is_fresh_instance: boolean;
    files: readonly WatchmanFileChange[];
    'state-enter'?: string | null | undefined;
    'state-leave'?: string | null | undefined;
    clock?: Readonly<{
      scm: {
        'mergebase-with'?: string;
        mergebase?: string;
      };
      clock: string;
    }>;
  };

  export type WatchmanLogEvent = unknown;

  export type SavedStateInfo = Readonly<{
    'manifold-path': string | null | undefined;
    'manifold-bucket': string | null | undefined;
    error: string | null | undefined;
  }>;

  export type WatchmanFileType =
    | 'b' // block special file
    | 'c' // character special file
    | 'd' // directory
    | 'f' // regular file
    | 'l' // symbolic link
    | 'p' // named pipe (fifo)
    | 's' // socket
    | 'D' // Solaris Door
    | '?'; // An unknown file type

  export type WatchmanFile = Readonly<{
    name: string;
    exists: boolean;
    dev?: number;
    cclock?: string;
    gid?: number;
    ino?: number;
    type?: WatchmanFileType;
    mode?: number;
    mtime_ms?: number | Readonly<{ toNumber: () => number }>;
    mtime?: number;
    mtime_us?: number;
    mtime_ns?: number;
    mtime_f?: number;
    new?: boolean;
    nlink?: number;
    size?: number;
    uid?: number;
    'content.sha1hex'?: string;
    symlink_target?: string;
  }>;

  export type WatchmanFileChange = WatchmanFile &
    Readonly<{
      new: boolean;
    }>;

  export type WatchmanQueryResponse = Readonly<{
    'saved-state-info'?: SavedStateInfo;
    files: readonly WatchmanFile[];
    clock: {
      scm: { 'mergebase-with': string; mergebase: string };
      clock: string;
    };
    is_fresh_instance: boolean;
    version: string;
    warning?: string;
  }>;

  export type WatchmanDirnameExpression = ['dirname' | 'idirname', string];

  export type WatchmanMatchExpression =
    | ['match' | 'imatch', string]
    | ['match' | 'imatch', string, 'basename' | 'wholename']
    | [
        'match' | 'imatch',
        string,
        'basename' | 'wholename',
        Readonly<{ includedotfiles?: boolean; noescape?: boolean }>,
      ];

  export type WatchmanNotExpression = ['not', WatchmanExpression];

  export type WatchmanSuffixExpression = ['suffix', string | readonly string[]];

  export type WatchmanNameExpression =
    | ['name' | 'iname', string | readonly string[]]
    | ['name' | 'iname', string | readonly string[], 'basename' | 'wholename'];

  export type WatchmanTypeExpression = ['type', WatchmanFileType];

  export type WatchmanVariadicExpression = ['allof' | 'anyof', ...WatchmanExpression[]];

  export type WatchmanExpression =
    | WatchmanDirnameExpression
    | WatchmanMatchExpression
    | WatchmanNotExpression
    | WatchmanNameExpression
    | WatchmanSuffixExpression
    | WatchmanTypeExpression
    | WatchmanVariadicExpression;

  export type WatchmanQuerySince =
    | string
    | Readonly<{
        clock?: string;
        scm: Readonly<{
          'mergebase-with': string;
          'saved-state'?: {
            storage: string;
            config: { project: string; [key: string]: unknown };
          };
        }>;
      }>;

  export type WatchmanQuery = {
    defer?: readonly string[];
    expression?: WatchmanExpression;
    fields: readonly string[];
    glob?: readonly string[];
    glob_includedotfiles?: boolean;
    path?: readonly string[];
    // A repo-root-relative path to a subdirectory within which
    // the query will be constrained.  Returned file names in
    // WatchmanFile will be relative to this location.
    relative_root?: string;
    since?: WatchmanQuerySince;
    suffix?: string | readonly string[];
  };

  // Merged into `@types/fb-watchman`'s `Client` class, adding the command
  // signatures Metro uses with Metro's response types.
  export interface Client {
    command(
      config: ['watch-project', string],
      callback: (
        error: Error | null | undefined,
        response: WatchmanWatchResponse
      ) => void | Promise<void>
    ): void;
    command(
      config: ['watch-list'],
      callback: (error: Error | null | undefined, response: WatchmanWatchListResponse) => void
    ): void;
    command(
      config: ['query', string, WatchmanQuery],
      callback: (error: Error | null | undefined, response: WatchmanQueryResponse) => void
    ): void;
    command(
      config: ['find', string, string],
      callback: (error: Error | null | undefined, response: WatchmanQueryResponse) => void
    ): void;
    command(
      config: ['clock', string],
      callback: (error: Error | null | undefined, response: WatchmanClockResponse) => void
    ): void;
    command(
      config: ['subscribe', string, string, WatchmanQuery],
      callback: (error: Error | null | undefined, response: WatchmanSubscribeResponse) => void
    ): void;
    command(
      config: ['state-enter', string, string],
      callback: (error: Error | null | undefined, response: WatchmanBaseResponse) => void
    ): void;
    command(
      config: ['state-leave', string, string],
      callback: (error: Error | null | undefined, response: WatchmanBaseResponse) => void
    ): void;

    on(event: 'connect', listener: () => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'subscription', listener: (event: WatchmanSubscriptionEvent) => void): this;
    on(event: 'log', listener: (event: WatchmanLogEvent) => void): this;
  }
}
