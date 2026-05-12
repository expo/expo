import type { ReactNode } from 'react';
import { type ImmutableRequest } from './ImmutableRequest';
import type { AssetInfo, GetStreamingContentOptions } from './manifest';
import type { Metadata } from './metadata';
export interface MatchedRouteMetadata {
    file: string;
    page: string;
}
export interface ResolvedMetadata {
    metadata: Metadata;
    headNodes: ReactNode[];
}
export interface ResolveMetadataOptions {
    route: MatchedRouteMetadata;
    request: ImmutableRequest;
    params: Record<string, string | string[]>;
}
/**
 * The SSR render module exported from `_expo/server/render.js`.
 *
 * {@link import('@expo/router-server/src/static/renderStreamingContent')}
 */
export interface ServerRenderModule {
    resolveMetadata?(options: ResolveMetadataOptions): Promise<ResolvedMetadata | null>;
    /** {@type import('@expo/router-server/src/static/renderStreamingContent').getStreamingContent} */
    getStreamingContent(location: URL, options?: GetStreamingContentOptions): Promise<ReadableStream<Uint8Array>>;
}
export interface RenderOptions {
    loader?: {
        data: unknown;
        key: string;
    };
    metadata?: ResolvedMetadata | null;
    assets?: AssetInfo;
}
export type SsrRenderFn = (request: Request, options?: RenderOptions) => Promise<ReadableStream<Uint8Array>>;
/** Module exported from loader bundle, typically `_expo/loaders/[ROUTE].js` */
export interface LoaderModule {
    loader(request: ImmutableRequest | undefined, params: Record<string, string>): Promise<unknown> | unknown;
}
