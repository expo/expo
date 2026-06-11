import { ConfigPlugin } from 'expo/config-plugins';
type AsyncRouteOption = 'development' | 'production' | boolean;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
type RedirectConfig = {
    /** The previous file path that this route should redirect from */
    source: string;
    /** The target file path that this route should redirect to */
    destination: string;
    /** Whether the redirect is temporary or permanent. Defaults to `false`. */
    permanent?: boolean;
    /** HTTP methods that should be redirected. Omit to redirect all methods. */
    methods?: HttpMethod[];
};
type RewriteConfig = {
    /** The previous file path that should be rewritten */
    source: string;
    /** The target file path that this route should rewrite */
    destination: string;
    /** HTTP methods that should be rewritten. Omit to rewrite all methods. */
    methods?: HttpMethod[];
};
export type Props = {
    /** Production origin URL where assets in the public folder are hosted. The fetch function is polyfilled to support relative requests from this origin in production, development origin is inferred using the Expo CLI development server. */
    origin?: string | boolean;
    /** A more specific origin URL used in the `expo-router/head` module for iOS handoff. Defaults to `origin`. */
    headOrigin?: string;
    /** Changes the routes directory from `app` to another value. Defaults to `app`. Avoid using this property. */
    root?: string;
    /** Enable or disable platform-specific routes. Defaults to `true`. */
    platformRoutes?: boolean;
    /** Enable or disable automatically generated routes. Defaults to `true`. */
    sitemap?: boolean;
    /** Should Async Routes be enabled. `production` is currently web-only and will be disabled on native. */
    asyncRoutes?: AsyncRouteOption | {
        android?: AsyncRouteOption;
        ios?: AsyncRouteOption;
        web?: AsyncRouteOption;
        default?: AsyncRouteOption;
    };
    /** Enable or disable partial route type generation. Defaults to `true`. */
    partialRouteTypes?: boolean;
    /** Enable static redirects. Defaults to `true`. */
    redirects?: RedirectConfig[];
    /** Enable static rewrites */
    rewrites?: RewriteConfig[];
    /** A list of headers that are set on every route response from the server */
    headers?: Record<string, string | string[]>;
    /** Enable experimental server middleware support with a `+middleware.ts` file. Requires `web.output: 'server'` to be set in app config. */
    unstable_useServerMiddleware?: boolean;
    /** Enable experimental data loader support. Requires `web.output: 'static' | 'server'` to be set in app config. */
    unstable_useServerDataLoaders?: boolean;
    /** Enable experimental server-side rendering. When enabled with `web.output: 'server'`, HTML is rendered at request time instead of being pre-rendered at build time. */
    unstable_useServerRendering?: boolean;
    /** Disable synchronous layout updates for native screens. */
    disableSynchronousScreensUpdates?: boolean;
    /** Rerender the app on color scheme changes. When enabled, the app tree will rerender when the system theme changes (light/dark mode). Defaults to `true`. */
    adaptiveColors?: boolean;
};
declare const withRouter: ConfigPlugin<Props | void>;
export default withRouter;
