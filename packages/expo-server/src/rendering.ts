import { type ImmutableRequest } from './ImmutableRequest';
import type { AssetInfo, GetStreamingContentOptions } from './manifest';
import type { Metadata } from './metadata';

export interface MatchedRouteMetadata {
  file: string;
  page: string;
}

export interface ResolvedMetadata {
  metadata: Metadata;
  // This is a ReactNode[] internally, but remains opaque here until we decide whether
  // expo-server should expose React types in its public API surface.
  // This should become a named server document type once that API is finalized.
  headNodes: unknown[];
}

export interface ResolveMetadataOptions {
  route: MatchedRouteMetadata;
  request: ImmutableRequest;
  params: Record<string, string | string[]>;
}

/**
 * The SSR render module exported from `_expo/server/render.js`.
 *
 * {@link import('@expo/router-server/src/static/renderStaticContent')}
 */
export interface ServerRenderModule {
  resolveMetadata?(options: ResolveMetadataOptions): Promise<ResolvedMetadata | null>;
  /** {@link import('@expo/router-server/src/static/renderStaticContent').getStreamingContent} */
  getStreamingContent(
    location: URL,
    options?: GetStreamingContentOptions
  ): Promise<ReadableStream<Uint8Array>>;
}

export interface RenderOptions {
  loader?: { data: unknown; key: string };
  metadata?: ResolvedMetadata | null;
  assets?: AssetInfo;
}

export type SsrRenderFn = (
  request: Request,
  options?: RenderOptions
) => Promise<ReadableStream<Uint8Array>>;

/** Module exported from loader bundle, typically `_expo/loaders/[ROUTE].js` */
export interface LoaderModule {
  loader(
    request: ImmutableRequest | undefined,
    params: Record<string, string>
  ): Promise<unknown> | unknown;
}
