import type { Minimatch } from 'minimatch';
import type { SourceSkips } from './sourcer/SourceSkips';
export type FingerprintSource = HashSource & {
    /**
     * Hash value of the `source`.
     * If the source is excluded the value will be null.
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
     * Sources and their hash values from which the project fingerprint was generated.
     */
    sources: FingerprintSource[];
    /**
     * The final hash value of the whole project fingerprint.
     */
    hash: string;
}
export type FingerprintDiffItem = {
    /**
     * The operation type of the diff item.
     */
    op: 'added';
    /**
     * The added source.
     */
    addedSource: FingerprintSource;
} | {
    /**
     * The operation type of the diff item.
     */
    op: 'removed';
    /**
     * The removed source.
     */
    removedSource: FingerprintSource;
} | {
    /**
     * The operation type of the diff item.
     */
    op: 'changed';
    /**
     * The source before.
     */
    beforeSource: FingerprintSource;
    /**
     * The source after.
     */
    afterSource: FingerprintSource;
};
export type Platform = 'android' | 'ios';
export type ProjectWorkflow = 'generic' | 'managed' | 'unknown';
export interface Options {
    /**
     * Limit native files to those for specified platforms.
     * @default ['android', 'ios']
     */
    platforms?: Platform[];
    /**
     * I/O concurrency limit.
     * @default The number of CPU cores.
     */
    concurrentIoLimit?: number;
    /**
     * The algorithm to use for `crypto.createHash()`.
     * @default 'sha1'
     */
    hashAlgorithm?: string;
    /**
     * Exclude specified directories from hashing. The supported pattern is the same as `glob()`.
     * Default is `['android/build', 'android/app/build', 'android/app/.cxx', 'ios/Pods']`.
     * @deprecated Use `ignorePaths` instead.
     */
    dirExcludes?: string[];
    /**
     * Ignore files and directories from hashing. The supported pattern is the same as `glob()`.
     *
     * The pattern matching is slightly different from gitignore. Partial matching is unsupported. For example, `build` does not match `android/build`; instead, use `'**' + '/build'`.
     * @see [minimatch implementations](https://github.com/isaacs/minimatch#comparisons-to-other-fnmatchglob-implementations) for further reference.
     *
     * Fingerprint comes with implicit default ignorePaths defined in `Options.DEFAULT_IGNORE_PATHS`.
     * If you want to override the default ignorePaths, use `!` prefix in `ignorePaths`.
     */
    ignorePaths?: string[];
    /**
     * Additional sources for hashing.
     */
    extraSources?: HashSource[];
    /**
     * Skips some sources from fingerprint. Value is the result of bitwise-OR'ing desired values of SourceSkips.
     * @default DEFAULT_SOURCE_SKIPS
     */
    sourceSkips?: SourceSkips;
    /**
     * Enable ReactImportsPatcher to transform imports from React of the form `#import "RCTBridge.h"` to `#import <React/RCTBridge.h>`.
     * This is useful when you want to have a stable fingerprint for Expo projects,
     * since expo-modules-autolinking will change the import style on iOS.
     * @default true for Expo SDK 51 and lower.
     */
    enableReactImportsPatcher?: boolean;
    /**
     * Use the react-native core autolinking sources from `expo-modules-autolinking` rather than `@react-native-community/cli`.
     * @default true for Expo SDK 52 and higher.
     */
    useRNCoreAutolinkingFromExpo?: boolean;
    /**
     * Whether running the functions should mute all console output. This is useful when fingerprinting is being done as
     * part of a CLI that outputs a fingerprint and outputting anything else pollutes the results.
     */
    silent?: boolean;
    /**
     * Whether to include verbose debug info in source output. Useful for debugging.
     */
    debug?: boolean;
    /**
     * A custom hook function to transform file content sources before hashing.
     */
    fileHookTransform?: FileHookTransformFunction;
}
type SourceSkipsKeys = keyof typeof SourceSkips;
/**
 * Supported options for use in fingerprint.config.js
 */
export type Config = Pick<Options, 'concurrentIoLimit' | 'hashAlgorithm' | 'ignorePaths' | 'extraSources' | 'enableReactImportsPatcher' | 'useRNCoreAutolinkingFromExpo' | 'debug' | 'fileHookTransform'> & {
    sourceSkips?: SourceSkips | SourceSkipsKeys[];
};
/**
 * Hook function to transform file content sources before hashing.
 */
export type FileHookTransformFunction = (
/**
 * Source from HashSourceFile or HashSourceContents.
 */
source: FileHookTransformSource, 
/**
 * The chunk of file content.
 * When the stream reaches the end, the chunk will be null.
 */
chunk: Buffer | string | null, 
/**
 * Indicates the end of the file.
 */
isEndOfFile: boolean, 
/**
 * The encoding of the chunk.
 */
encoding: BufferEncoding) => Buffer | string | null;
/**
 * The `source` parameter for `FileHookTransformFunction`.
 */
export type FileHookTransformSource = {
    type: 'file';
    filePath: string;
} | {
    type: 'contents';
    id: string;
};
export interface HashSourceFile {
    type: 'file';
    filePath: string;
    /**
     * Reasons of this source coming from.
     */
    reasons: string[];
}
export interface HashSourceDir {
    type: 'dir';
    filePath: string;
    /**
     * Reasons of this source coming from.
     */
    reasons: string[];
}
export interface HashSourceContents {
    type: 'contents';
    id: string;
    contents: string | Buffer;
    /**
     * Reasons of this source coming from.
     */
    reasons: string[];
}
export type HashSource = HashSourceFile | HashSourceDir | HashSourceContents;
export interface DebugInfoFile {
    path: string;
    hash: string;
    /** Indicates whether the source is transformed by `fileHookTransform`. */
    isTransformed?: boolean;
}
export interface DebugInfoDir {
    path: string;
    hash: string;
    children: (DebugInfoFile | DebugInfoDir | undefined)[];
}
export interface DebugInfoContents {
    hash: string;
    /** Indicates whether the source is transformed by `fileHookTransform`. */
    isTransformed?: boolean;
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
/**
 * @hidden
 */
export type NormalizedOptions = Omit<Options, 'ignorePaths'> & {
    platforms: NonNullable<Options['platforms']>;
    concurrentIoLimit: NonNullable<Options['concurrentIoLimit']>;
    hashAlgorithm: NonNullable<Options['hashAlgorithm']>;
    sourceSkips: NonNullable<Options['sourceSkips']>;
    enableReactImportsPatcher: NonNullable<Options['enableReactImportsPatcher']>;
    ignorePathMatchObjects: Minimatch[];
    /**
     * A ignore pattern list specific for dir matching. It is built by `ignorePathMatchObjects` in runtime.
     */
    ignoreDirMatchObjects: Minimatch[];
    /**
     * Indicate whether the project is using CNG for each platform.
     */
    useCNGForPlatforms: Record<Platform, boolean>;
};
export {};
