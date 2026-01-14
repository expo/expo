import { GetStaticContentOptions } from './manifest';

/**
 * The SSR render module exported from `_expo/server/render.js`.
 *
 * {@link import('@expo/router-server/src/static/renderStaticContent')}
 */
export interface ServerRenderModule {
  /** {@link import('@expo/router-server/src/static/renderStaticContent').getStaticContent} */
  getStaticContent(location: URL, options?: GetStaticContentOptions): Promise<string>;
}

export interface RenderOptions {
  loader?: { data: unknown };
}

/** Module exported from loader bundle, typically `_expo/loaders/[ROUTE].js` */
export interface LoaderModule {
  loader?(args: { params: Record<string, string>; request: Request }): Promise<unknown> | unknown;
}

export type SsrRenderFn = (request: Request, options?: RenderOptions) => Promise<string>;
