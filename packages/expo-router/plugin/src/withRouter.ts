import { validate } from '@expo/schema-utils';
import { type ConfigPlugin, withInfoPlist, withPodfile } from 'expo/config-plugins';
import { styleText } from 'node:util';

const schema = require('../options.json');

const withExpoHeadIos: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    // TODO: Add a way to enable this...
    // config.modResults.CoreSpotlightContinuation = true;

    // $(PRODUCT_BUNDLE_IDENTIFIER).expo.index_route
    if (!Array.isArray(config.modResults.NSUserActivityTypes)) {
      config.modResults.NSUserActivityTypes = [];
    }
    // This ensures that stored `NSUserActivityType`s can be opened in-app.
    // This is important for moving between native devices or from opening a link that was saved
    // in a Quick Note or Siri Reminder.
    const activityType = '$(PRODUCT_BUNDLE_IDENTIFIER).expo.index_route';
    if (!config.modResults.NSUserActivityTypes.includes(activityType)) {
      config.modResults.NSUserActivityTypes.push(activityType);
    }
    return config;
  });
};

const withGammaScreens: ConfigPlugin = (config) => {
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes('RNS_GAMMA_ENABLED')) {
      config.modResults.contents = `# Set by expo-router. This enables Fabric-only features from react-native-screens\nENV['RNS_GAMMA_ENABLED'] ||= '1'\n${config.modResults.contents}`;
    }
    return config;
  });
};

/**
 * Controls whether async routes are enabled. `'development'` and `'production'` enable them
 * for that environment only.
 */
export type AsyncRouteOption = 'development' | 'production' | boolean;

/**
 * HTTP methods a redirect, rewrite, or header rule can match.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

/**
 * A static redirect from one route to another.
 */
export type RedirectConfig = {
  /**
   * The previous file path that this route should redirect from.
   */
  source: string;
  /**
   * The target file path that this route should redirect to.
   */
  destination: string;
  /**
   * Whether the redirect is temporary or permanent.
   * @default false
   */
  permanent?: boolean;
  /**
   * HTTP methods that should be redirected. Omit to redirect all methods.
   */
  methods?: HttpMethod[];
};

/**
 * A static rewrite from one route to another.
 */
export type RewriteConfig = {
  /**
   * The previous file path that should be rewritten.
   */
  source: string;
  /**
   * The target file path that this route should rewrite.
   */
  destination: string;
  /**
   * HTTP methods that should be rewritten. Omit to rewrite all methods.
   */
  methods?: HttpMethod[];
};

/**
 * Response headers applied to routes matching a path.
 */
export type PageHeadersConfig = {
  /**
   * The path to match for the headers to apply.
   */
  source: string;
  /**
   * Response headers to apply for matching paths.
   */
  headers: Record<string, string | string[]>;
};

/**
 * Options accepted by the `expo-router` config plugin.
 */
export type RouterConfigPluginProps = {
  /**
   * Production origin URL where assets in the public folder are hosted. The fetch function is
   * polyfilled to support relative requests from this origin in production. The development
   * origin is inferred using the Expo CLI development server.
   */
  origin?: string | boolean;
  /**
   * A more specific origin URL used in the `expo-router/head` module for iOS handoff.
   * @default origin
   */
  headOrigin?: string;
  /**
   * Changes the routes directory from `app` to another value. Avoid using this property.
   * @default 'app'
   */
  root?: string;
  /**
   * Enable or disable platform-specific routes.
   * @default true
   */
  platformRoutes?: boolean;
  /**
   * Enable or disable automatically generated routes.
   * @default true
   */
  sitemap?: boolean;
  /**
   * Enable async routes. Stable and enabled by default on web in SDK 58 and later. Experimental
   * and disabled by default on native.
   */
  asyncRoutes?:
    | AsyncRouteOption
    | {
        android?: AsyncRouteOption;
        ios?: AsyncRouteOption;
        web?: AsyncRouteOption;
        default?: AsyncRouteOption;
      };
  /**
   * Enable or disable partial route type generation.
   * @default true
   */
  partialRouteTypes?: boolean;
  /**
   * Static redirects.
   */
  redirects?: RedirectConfig[];
  /**
   * Static rewrites.
   */
  rewrites?: RewriteConfig[];
  /**
   * A list of headers that are set on every route response from the server.
   */
  headers?: Record<string, string | string[]>;
  /**
   * A list of headers that are set on a specific path's response from the server.
   */
  pageHeaders?: PageHeadersConfig[];
  /**
   * Enable API routes with static or server output. Defaults to `true` for server output and
   * `false` for static output.
   */
  apiRoutes?: boolean;
  /**
   * Enable experimental server middleware support. Middleware no longer requires an opt-in as of
   * SDK 58. This option has no effect.
   * @deprecated
   */
  unstable_useServerMiddleware?: boolean;
  /**
   * Data loaders no longer require an opt-in as of SDK 58. This option has no effect.
   * @deprecated
   */
  unstable_useServerDataLoaders?: boolean;
  /**
   * Server rendering no longer requires an opt-in as of SDK 58. This option has no effect.
   * @deprecated
   */
  unstable_useServerRendering?: boolean;
  /**
   * Disable synchronous layout updates for native screens.
   */
  disableSynchronousScreensUpdates?: boolean;
  /**
   * Rerender the app on color scheme changes. When enabled, the app tree will rerender when the
   * system theme changes (light/dark mode).
   * @default true
   */
  adaptiveColors?: boolean;
};

const withRouter: ConfigPlugin<RouterConfigPluginProps | void> = (config, _props) => {
  const props = _props || {};

  if (Object.hasOwn(props, 'unstable_useServerMiddleware')) {
    warnOnce(
      '`unstable_useServerMiddleware` in the `expo-router` config plugin is deprecated as of SDK 58 and has no effect. Remove it from your app config.'
    );
  }

  if (Object.hasOwn(props, 'unstable_useServerDataLoaders')) {
    warnOnce(
      '`unstable_useServerDataLoaders` in the `expo-router` config plugin is deprecated as of SDK 58 and has no effect. Remove it from your app config.'
    );
  }

  if (Object.hasOwn(props, 'unstable_useServerRendering')) {
    warnOnce(
      '`unstable_useServerRendering` in the `expo-router` config plugin is deprecated as of SDK 58 and has no effect. Remove it from your app config.'
    );
  }

  validate(schema, props);

  if (props.apiRoutes === true && !['static', 'server'].includes(config.web?.output ?? '')) {
    throw new Error(
      'The `apiRoutes` option requires `web.output` to be set to `static` or `server`.'
    );
  }

  withExpoHeadIos(config);
  withGammaScreens(config);

  const router = normalizeAsyncRoutesProp({
    ...config.extra?.router,
    ...props,
  });

  return {
    ...config,
    extra: {
      ...config.extra,
      router,
    },
  };
};

function normalizeAsyncRoutesProp(props: RouterConfigPluginProps) {
  const asyncRoutes = props.asyncRoutes;

  if (asyncRoutes == null) {
    return {
      ...props,
      asyncRoutes: { web: true },
    };
  }

  if (typeof asyncRoutes === 'object' && asyncRoutes.web == null && asyncRoutes.default == null) {
    return {
      ...props,
      asyncRoutes: { ...asyncRoutes, web: true },
    };
  }

  return props;
}

const warnMap: Record<string, boolean> = {};
function warnOnce(message: string) {
  if (!warnMap[message]) {
    warnMap[message] = true;
    console.warn(styleText('red', message, { stream: process.stderr }));
  }
}

export default withRouter;
