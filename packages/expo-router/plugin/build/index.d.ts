import { ConfigPlugin } from 'expo/config-plugins';
declare const withRouter: ConfigPlugin<{
    /** Production origin URL where assets in the public folder are hosted. The fetch function is polyfilled to support relative requests from this origin in production, development origin is inferred using the Expo CLI development server. */
    origin?: string;
    /** A more specific origin URL used in the `expo-router/head` module for iOS handoff. Defaults to `origin`. */
    headOrigin?: string;
    /** Changes the routes directory from `app` to another value. Defaults to `app`. Avoid using this property. */
    root?: string;
    /** Should Async Routes be enabled, currently only `development` is supported. */
    asyncRoutes?: string | {
        android?: string;
        ios?: string;
        web?: string;
        default?: string;
    };
} | void>;
export default withRouter;
