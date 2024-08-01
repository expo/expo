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
type IsValidPathItem<T> = T extends `/${infer _}` ? false : T extends '[]' | '' ? false : true;
type IsValidPath<T> = T extends `/${infer L}/${infer R}` ? IsValidPathItem<L> extends true ? IsValidPath<`/${R}`> : false : T extends `/${infer U}` ? IsValidPathItem<U> : false;
type HasSlugInPath<T, K extends string> = T extends `/[${K}]/${infer _}` ? true : T extends `/${infer _}/${infer U}` ? HasSlugInPath<`/${U}`, K> : T extends `/[${K}]` ? true : false;
type PathWithSlug<T, K extends string> = IsValidPath<T> extends true ? (HasSlugInPath<T, K> extends true ? T : never) : never;
type PathWithoutSlug<T> = T extends '/' ? T : IsValidPath<T> extends true ? HasSlugInPath<T, string> extends true ? never : T : never;
type CreatePage = <Path extends string, SlugKey extends string, WildSlugKey extends string>(page: ({
    render: 'static';
    path: PathWithoutSlug<Path>;
    component: FunctionComponent<RouteProps>;
} | {
    render: 'static';
    path: PathWithSlug<Path, SlugKey>;
    staticPaths: string[] | string[][];
    component: FunctionComponent<RouteProps & Record<SlugKey, string>>;
} | {
    render: 'dynamic';
    path: PathWithoutSlug<Path>;
    component: FunctionComponent<RouteProps>;
} | {
    render: 'dynamic';
    path: PathWithSlug<Path, SlugKey | `...${WildSlugKey}`>;
    component: FunctionComponent<RouteProps & Record<SlugKey, string> & Record<WildSlugKey, string[]>>;
}) & {
    unstable_disableSSR?: boolean;
}) => void;
type CreateLayout = <T extends string>(layout: {
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
    getSsrConfig: import("../server.js").GetSsrConfig | undefined;
};
export {};
//# sourceMappingURL=create-pages.d.ts.map