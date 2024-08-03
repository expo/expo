/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * From waku https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/lib/renderers/rsc-renderer.ts
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
        id: string;
        chunks: string[];
        name: string;
        async: boolean;
    }) => void;
};
type ResolveClientEntry = (id: string) => {
    id: string;
    chunks: string[];
};
type RenderRscOpts = {
    isExporting: true;
    entries: EntriesPrd;
    resolveClientEntry?: ResolveClientEntry;
} | {
    isExporting: false;
    entries: EntriesDev;
    resolveClientEntry: ResolveClientEntry;
};
export declare function renderRsc(args: RenderRscArgs, opts: RenderRscOpts): Promise<ReadableStream>;
export {};
//# sourceMappingURL=rsc-renderer.d.ts.map