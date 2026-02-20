import { type ImmutableRequest } from './ImmutableRequest';
import { type GetStaticContentOptions } from './manifest';
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
    loader?: {
        data: unknown;
        key: string;
    };
}
export type SsrRenderFn = (request: Request, options?: RenderOptions) => Promise<string>;
/** Module exported from loader bundle, typically `_expo/loaders/[ROUTE].js` */
export interface LoaderModule {
    loader(request: ImmutableRequest | undefined, params: Record<string, string>): Promise<unknown> | unknown;
}
