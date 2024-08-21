import type { IMinimatch } from 'minimatch';

import type { SourceSkips } from './sourcer/SourceSkips';

export type FingerprintSource = HashSource & {
  /**
   * Hash value of the `source`.
   * If the source is excluding by `Options.dirExcludes`, the value will be null.
   */
  hash: string | null;
  /**
   * Debug info from the hashing process. Differs based on source type. Designed to be consumed by humans
   * as opposed to programmatically.
   */
  debugInfo?: DebugInfo;
};

export interface Fingerprint {
  /**
   * Sources and their hash values to generate a fingerprint
   */
  sources: FingerprintSource[];

  /**
   * The final hash value of the whole fingerprint
   */
  hash: string;
}

export interface FingerprintDiffItem {
  /**
   * The operation type of the diff item.
   */
  op: 'added' | 'removed' | 'changed';

  /**
   * The source of the diff item.
   *   - When type is 'added', the source is the new source.
   *   - When type is 'removed', the source is the old source.
   *   - When type is 'changed', the source is the new source.
   */
  source: FingerprintSource;
}

export type Platform = 'android' | 'ios';

export interface Options {
  /**
   * Only get native files from the given platforms. Default is `['android', 'ios']`.
   */
  platforms?: Platform[];

  /**
   * I/O concurrent limit. Default is the number of CPU core.
   */
  concurrentIoLimit?: number;

  /**
   * The algorithm passing to `crypto.createHash()`. Default is `'sha1'`.
   */
  hashAlgorithm?: string;

  /**
   * Excludes directories from hashing. This supported pattern is as `glob()`.
   * Default is `['android/build', 'android/app/build', 'android/app/.cxx', 'ios/Pods']`.
   * @deprecated Use `ignorePaths` instead.
   */
  dirExcludes?: string[];

  /**
   * Ignore files and directories from hashing. This supported pattern is as `glob()`.
   *
   * Please note that the pattern matching is slightly different from gitignore. For example, we don't support partial matching where `build` does not match `android/build`. You should use `'**' + '/build'` instead.
   * @see [minimatch implementations](https://github.com/isaacs/minimatch#comparisons-to-other-fnmatchglob-implementations) for more reference.
   *
   * Besides this `ignorePaths`, fingerprint comes with implicit default ignorePaths defined in `Options.DEFAULT_IGNORE_PATHS`.
   * If you want to override the default ignorePaths, use `!` prefix.
   */
  ignorePaths?: string[];

  /**
   * Additional sources for hashing.
   */
  extraSources?: HashSource[];

  /**
   * Skips some sources from fingerprint.
   * @default DEFAULT_SOURCE_SKIPS
   */
  sourceSkips?: SourceSkips;

  /**
   * Enable ReactImportsPatcher to transform imports from React of the form `#import "RCTBridge.h"` to `#import <React/RCTBridge.h>`.
   * This is useful when you want to have a stable fingerprint for Expo projects,
   * since expo-modules-autolinking will change the import style on iOS.
   * @default true
   */
  enableReactImportsPatcher?: boolean;

  /**
   * Whether running the functions should mute all console output. This is useful when fingerprinting is being done as
   * part of a CLI that outputs a fingerprint and outputting anything else pollutes the results.
   */
  silent?: boolean;

  /**
   * Whether to include verbose debug info in source output. Useful for debugging.
   */
  debug?: boolean;
}

type SourceSkipsKeys = keyof typeof SourceSkips;

/**
 * Supported options from fingerprint.config.js
 */
export type Config = Pick<
  Options,
  | 'concurrentIoLimit'
  | 'hashAlgorithm'
  | 'ignorePaths'
  | 'extraSources'
  | 'enableReactImportsPatcher'
  | 'debug'
> & {
  sourceSkips?: SourceSkips | SourceSkipsKeys[];
};

//#region internal types

export type NormalizedOptions = Omit<Options, 'ignorePaths'> & {
  platforms: NonNullable<Options['platforms']>;
  concurrentIoLimit: NonNullable<Options['concurrentIoLimit']>;
  hashAlgorithm: NonNullable<Options['hashAlgorithm']>;
  sourceSkips: NonNullable<Options['sourceSkips']>;
  enableReactImportsPatcher: NonNullable<Options['enableReactImportsPatcher']>;

  ignorePathMatchObjects: IMinimatch[];
};

export interface HashSourceFile {
  type: 'file';
  filePath: string;

  /**
   * Reasons of this source coming from
   */
  reasons: string[];
}

export interface HashSourceDir {
  type: 'dir';
  filePath: string;

  /**
   * Reasons of this source coming from
   */
  reasons: string[];
}

export interface HashSourceContents {
  type: 'contents';
  id: string;
  contents: string | Buffer;

  /**
   * Reasons of this source coming from
   */
  reasons: string[];
}

export type HashSource = HashSourceFile | HashSourceDir | HashSourceContents;

export interface DebugInfoFile {
  path: string;
  hash: string;
}

export interface DebugInfoDir {
  path: string;
  hash: string;
  children: (DebugInfoFile | DebugInfoDir | undefined)[];
}

export interface DebugInfoContents {
  hash: string;
}

export type DebugInfo = DebugInfoFile | DebugInfoDir | DebugInfoContents;

export interface HashResultFile {
  type: 'file';
  id: string;
  hex: string;
  debugInfo?: DebugInfoFile;
}

export interface HashResultDir {
  type: 'dir';
  id: string;
  hex: string;
  debugInfo?: DebugInfoDir;
}

export interface HashResultContents {
  type: 'contents';
  id: string;
  hex: string;
  debugInfo?: DebugInfoContents;
}

export type HashResult = HashResultFile | HashResultDir | HashResultContents;

//#endregion
