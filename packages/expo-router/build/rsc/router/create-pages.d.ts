/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/create-pages.ts#L1
 */
import type { FunctionComponent, ReactNode } from 'react';
import type { RouteProps } from './common.js';
import type { BuildConfig } from '../server.js';
/**
 * Type version of `String.prototype.split()`. Splits the first string argument by the second string argument
 * @example
 * ```ts
 * // ['a', 'b', 'c']
 * type Case1 = Split<'abc', ''>
 * // ['a', 'b', 'c']
 * type Case2 = Split<'a,b,c', ','>
 * ```
 */
type Split<Str extends string, Del extends string | number> = string extends Str ? string[] : '' extends Str ? [] : Str extends `${infer T}${Del}${infer U}` ? [T, ...Split<U, Del>] : [Str];
/** Assumes that the path is a part of a slug path. */
type IsValidPathItem<T> = T extends `/${infer _}` ? false : T extends '[]' | '' ? false : true;
/**
 * This is a helper type to check if a path is valid in a slug path.
 */
export type IsValidPathInSlugPath<T> = T extends `/${infer L}/${infer R}` ? IsValidPathItem<L> extends true ? IsValidPathInSlugPath<`/${R}`> : false : T extends `/${infer U}` ? IsValidPathItem<U> : false;
/** Checks if a particular slug name exists in a path. */
export type HasSlugInPath<T, K extends string> = T extends `/[${K}]/${infer _}` ? true : T extends `/${infer _}/${infer U}` ? HasSlugInPath<`/${U}`, K> : T extends `/[${K}]` ? true : false;
export type HasWildcardInPath<T> = T extends `/[...${string}]/${string}` ? true : T extends `/${infer _}/${infer U}` ? HasWildcardInPath<`/${U}`> : T extends `/[...${string}]` ? true : false;
export type PathWithSlug<T, K extends string> = IsValidPathInSlugPath<T> extends true ? (HasSlugInPath<T, K> extends true ? T : never) : never;
type _GetSlugs<Route extends string, SplitRoute extends string[] = Split<Route, '/'>, Result extends string[] = []> = SplitRoute extends [] ? Result : SplitRoute extends [`${infer MaybeSlug}`, ...infer Rest] ? Rest extends string[] ? MaybeSlug extends `[${infer Slug}]` ? _GetSlugs<Route, Rest, [...Result, Slug]> : _GetSlugs<Route, Rest, Result> : never : Result;
export type GetSlugs<Route extends string> = _GetSlugs<Route>;
export type StaticSlugRoutePathsTuple<T extends string, Slugs extends unknown[] = GetSlugs<T>, Result extends string[] = []> = Slugs extends [] ? Result : Slugs extends [infer _, ...infer Rest] ? StaticSlugRoutePathsTuple<T, Rest, [...Result, string]> : never;
type StaticSlugRoutePaths<T extends string> = HasWildcardInPath<T> extends true ? string[] | string[][] : StaticSlugRoutePathsTuple<T> extends [string] ? string[] : StaticSlugRoutePathsTuple<T>[];
export type PathWithoutSlug<T> = T extends '/' ? T : IsValidPathInSlugPath<T> extends true ? HasSlugInPath<T, string> extends true ? never : T : never;
type PathWithStaticSlugs<T extends string> = T extends `/` ? T : IsValidPathInSlugPath<T> extends true ? T : never;
export type PathWithWildcard<Path, SlugKey extends string, WildSlugKey extends string> = PathWithSlug<Path, SlugKey | `...${WildSlugKey}`>;
export type CreatePage = <Path extends string, SlugKey extends string, WildSlugKey extends string>(page: ({
    render: 'static';
    path: PathWithoutSlug<Path>;
    component: FunctionComponent<RouteProps>;
} | {
    render: 'static';
    path: PathWithStaticSlugs<Path>;
    staticPaths: StaticSlugRoutePaths<Path>;
    component: FunctionComponent<RouteProps & Record<SlugKey, string>>;
} | {
    render: 'dynamic';
    path: PathWithoutSlug<Path>;
    component: FunctionComponent<RouteProps>;
} | {
    render: 'dynamic';
    path: PathWithWildcard<Path, SlugKey, WildSlugKey>;
    component: FunctionComponent<RouteProps & Record<SlugKey, string> & Record<WildSlugKey, string[]>>;
}) & {
    unstable_disableSSR?: boolean;
}) => void;
export type CreateLayout = <T extends string>(layout: {
    render: 'static' | 'dynamic';
    path: PathWithoutSlug<T>;
    component: FunctionComponent<Omit<RouteProps, 'searchParams'> & {
        children: ReactNode;
    }>;
}) => void;
export declare function createPages(fn: (fns: {
    createPage: CreatePage;
    createLayout: CreateLayout;
    unstable_setBuildData: (path: string, data: unknown) => void;
}, opts: {
    unstable_buildConfig: BuildConfig | undefined;
}) => Promise<void>): {
    renderEntries: import("../server.js").RenderEntries;
    getBuildConfig: import("../server.js").GetBuildConfig | undefined;
    getSsrConfig: import("../server.js").GetSsrConfig | undefined; /**
     * This is a helper type to check if a path is valid in a slug path.
     */
};
export {};
//# sourceMappingURL=create-pages.d.ts.map