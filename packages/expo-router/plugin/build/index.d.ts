import { ConfigPlugin } from 'expo/config-plugins';
declare const withRouter: ConfigPlugin<{
    /** Production origin URL where assets in the public folder are hosted. The fetch function is polyfilled to support relative requests from this origin in production, development origin is inferred using the Expo CLI development server. */
    origin?: string;
    /** A more specific origin URL used in the `expo-router/head` module for iOS handoff. Defaults to `origin`. */
    headOrigin?: string;
    /** Should Async Routes be enabled. `production` is currently web-only and will be disabled on native. */
    root?: string;
    /** Should Async Routes be enabled, currently only `development` is supported. */
    asyncRoutes?: string | {
        android?: string;
        ios?: string;
        web?: string;
        default?: string;
    };
    /** Should the sitemap be generated. Defaults to `true` */
    sitemap?: boolean;
    /** Generate partial typed routes */
    partialTypedGroups?: boolean;
    /** A list of headers that are set on every route response from the server */
    headers: Record<string, string | string[]>;
    /** Enable experimental server middleware support with a `+middleware.ts` file. Requires `web.output: 'server'` to be set in app config. */
    unstable_useServerMiddleware?: boolean;
    /** Enable experimental data loader support. Requires `web.output: 'static'` to be set in app config. */
    unstable_useServerDataLoaders?: boolean;
    /** Enable experimental server-side rendering. When enabled with `web.output: 'server'`, HTML is rendered at request time instead of being pre-rendered at build time. */
    unstable_useServerRendering?: boolean;
    /** Enable automatic app rerender on color scheme changes. Defaults to `true`. */
    adaptiveColors?: boolean;
} | void>;
export default withRouter;
