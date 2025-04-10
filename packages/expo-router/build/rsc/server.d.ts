/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ReactNode } from 'react';
import type { PathSpec } from './path';
export declare const REQUEST_HEADERS = "__expo_requestHeaders";
type Config = any;
type Elements = Record<string, ReactNode>;
export type BuildConfig = {
    pathname: string | PathSpec;
    isStatic?: boolean | undefined;
    entries?: {
        input: string;
        skipPrefetch?: boolean | undefined;
        isStatic?: boolean | undefined;
    }[];
    context?: Record<string, unknown>;
    customCode?: string;
    customData?: unknown;
}[];
export type RenderEntries = (input: string, options: {
    params: unknown | undefined;
    buildConfig: BuildConfig | undefined;
}) => Promise<Elements | null>;
export type GetBuildConfig = (unstable_collectClientModules: (input: string) => Promise<string[]>) => Promise<BuildConfig>;
export type GetSsrConfig = (pathname: string, options: {
    searchParams: URLSearchParams;
    buildConfig?: BuildConfig | undefined;
}) => Promise<{
    input: string;
    searchParams?: URLSearchParams;
    html: ReactNode;
} | null>;
export declare function defineEntries(renderEntries: RenderEntries, getBuildConfig?: GetBuildConfig, getSsrConfig?: GetSsrConfig): {
    renderEntries: RenderEntries;
    getBuildConfig: GetBuildConfig | undefined;
    getSsrConfig: GetSsrConfig | undefined;
};
export type EntriesDev = {
    default: ReturnType<typeof defineEntries>;
};
export type EntriesPrd = EntriesDev & {
    loadConfig: () => Promise<Config>;
    loadModule: (id: string) => Promise<unknown>;
    dynamicHtmlPaths: [pathSpec: PathSpec, htmlHead: string][];
    publicIndexHtml: string;
};
type RenderStore = {
    rerender: (input: string, params?: unknown) => void;
    context: Record<string, unknown>;
};
/**
 * This is an internal function and not for public use.
 */
export declare const runWithRenderStore: <T>(renderStore: RenderStore, fn: () => T) => T;
export declare function rerender(input: string, params?: unknown): Promise<void>;
export declare function getContext<RscContext extends Record<string, unknown> = Record<string, unknown>>(): RscContext;
/** Get the request headers used to make the server component or action request. */
export declare function unstable_headers(): Promise<Headers>;
export {};
//# sourceMappingURL=server.d.ts.map