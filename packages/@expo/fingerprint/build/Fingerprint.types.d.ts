/// <reference types="node" />
export type FingerprintSource = HashSource & {
    /**
     * Hash value of the `source`.
     * If the source is excluding by `Options.dirExcludes`, the value will be null.
     */
    hash: string | null;
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
}
export interface NormalizedOptions extends Options {
    platforms: NonNullable<Options['platforms']>;
    concurrentIoLimit: NonNullable<Options['concurrentIoLimit']>;
    hashAlgorithm: NonNullable<Options['hashAlgorithm']>;
    ignorePaths: NonNullable<Options['ignorePaths']>;
}
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
export interface HashResult {
    id: string;
    hex: string;
}
