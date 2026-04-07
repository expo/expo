/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export declare class RootPathUtils {
    #private;
    constructor(rootDir: string);
    getBasenameOfNthAncestor(n: number): string;
    getParts(): readonly string[];
    absoluteToNormal(absolutePath: string): string;
    normalToAbsolute(normalPath: string): string;
    relativeToNormal(relativePath: string): string;
    resolveSymlinkToNormal(symlinkNormalPath: string, readlinkResult: string): string;
    getAncestorOfRootIdx(normalPath: string): number | null;
    joinNormalToRelative(normalPath: string, relativePath: string): {
        normalPath: string;
        collapsedSegments: number;
    };
    relative(from: string, to: string): string;
}
export declare function getAncestorOfRootIdx(normalPath: string): number;
export declare function pathsToPattern(paths: readonly string[], pathUtils: RootPathUtils): RegExp | null;
