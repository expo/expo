/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
type WatchmanExpression = readonly [string, ...any[]];
type WatchmanQuerySince = string | Readonly<{
    scm: Readonly<{
        'mergebase-with': string;
    }>;
}>;
interface WatchmanQuery {
    fields?: string[];
    expression?: WatchmanExpression;
    since?: WatchmanQuerySince;
    glob?: string[];
    glob_includedotfiles?: boolean;
    suffix?: readonly string[];
}
export declare function planQuery({ since, directoryFilters, extensions, includeSha1, includeSymlinks, }: {
    readonly since: WatchmanQuerySince | null | undefined;
    readonly directoryFilters: readonly string[];
    readonly extensions: readonly string[];
    readonly includeSha1: boolean;
    readonly includeSymlinks: boolean;
}): {
    query: WatchmanQuery;
    queryGenerator: string;
};
export {};
