/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ReactNode } from 'react';
import type { PathSpec } from './path';
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
    searchParams: URLSearchParams;
    buildConfig: BuildConfig | undefined;
}) => Promise<Elements | null>;
export type GetBuildConfig = (unstable_collectClientModules: (input: string) => Promise<string[]>) => Promise<BuildConfig>;
export type GetSsrConfig = (pathname: string, options: {
    searchParams: URLSearchParams;
    buildConfig?: BuildConfig | undefined;
}) => Promise<{
    input: string;
    searchParams?: URLSearchParams;
    body: ReactNode;
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
type RenderStore<RscContext extends Record<string, unknown> = Record<string, unknown>> = {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: RscContext;
};
/**
 * This is an internal function and not for public use.
 */
export declare const runWithRenderStore: <T>(renderStore: RenderStore, fn: () => T) => T;
export declare function rerender(input: string, searchParams?: URLSearchParams): void;
export declare function getContext<RscContext extends Record<string, unknown> = Record<string, unknown>>(): RscContext;
export {};
//# sourceMappingURL=server.d.ts.map