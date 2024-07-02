/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * From waku https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/utils/stream.ts#L1
 */
import { type EntriesDev, type EntriesPrd } from './server';
export interface RenderContext<T = unknown> {
    rerender: (input: string, searchParams?: URLSearchParams) => void;
    context: T;
}
type ResolvedConfig = any;
export type RenderRscArgs = {
    config: ResolvedConfig;
    input: string;
    searchParams: URLSearchParams;
    method: 'GET' | 'POST';
    context: Record<string, unknown> | undefined;
    body?: ReadableStream | undefined;
    contentType?: string | undefined;
    moduleIdCallback?: (module: {
        id: string | number;
        chunks: string[];
        name: string;
        async: boolean;
    }) => void;
};
type ResolveClientEntry = (id: string | number) => {
    id: string | number;
    url: string[];
};
type RenderRscOpts = {
    isExporting: true;
    entries: EntriesPrd;
    resolveClientEntry?: ResolveClientEntry;
} | {
    isExporting: false;
    entries: EntriesDev;
    loadServerFile: (fileURL: string) => Promise<unknown>;
    resolveClientEntry: ResolveClientEntry;
};
export declare function renderRsc(args: RenderRscArgs, opts: RenderRscOpts): Promise<ReadableStream>;
export declare function getBuildConfig(opts: {
    config: ResolvedConfig;
    entries: EntriesPrd;
    resolveClientEntry: ResolveClientEntry;
}): Promise<import("./server").BuildConfig>;
export type GetSsrConfigArgs = {
    config: ResolvedConfig;
    pathname: string;
    searchParams: URLSearchParams;
};
type GetSsrConfigOpts = {
    isDev: false;
    entries: EntriesPrd;
    resolveClientEntry: ResolveClientEntry;
} | {
    isDev: true;
    entries: EntriesDev;
    resolveClientEntry: ResolveClientEntry;
};
export declare function getSsrConfig(args: GetSsrConfigArgs, opts: GetSsrConfigOpts): Promise<{
    body: any;
    input: string;
    searchParams?: URLSearchParams | undefined;
} | null>;
export {};
//# sourceMappingURL=rsc-renderer.d.ts.map