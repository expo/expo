import { ConfigPlugin, withInfoPlist } from "expo/config-plugins";
import { validate } from "schema-utils";

const schema = require("../options.json");

const withExpoHeadIos: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    // $(PRODUCT_BUNDLE_IDENTIFIER).expo.index_route
    if (!Array.isArray(config.modResults.NSUserActivityTypes)) {
      config.modResults.NSUserActivityTypes = [];
    }
    // This ensures that stored `NSUserActivityType`s can be opened in-app.
    // This is important for moving between native devices or from opening a link that was saved
    // in a Quick Note or Siri Reminder.
    config.modResults.NSUserActivityTypes.push(
      "$(PRODUCT_BUNDLE_IDENTIFIER).expo.index_route"
    );
    return config;
  });
};

const withRouter: ConfigPlugin<
  {
    /** Production origin URL where assets in the public folder are hosted. The fetch function is polyfilled to support relative requests from this origin in production, development origin is inferred using the Expo CLI development server. */
    origin?: string;
    /** A more specific origin URL used in the `expo-router/head` module for iOS handoff. Defaults to `origin`. */
    headOrigin?: string;
    /** Changes the routes directory from `app` to another value. Defaults to `app`. Avoid using this property. */
    unstable_src?: string;
    /** Should Async Routes be enabled, currently only `development` is supported. */
    asyncRoutes?:
      | string
      | { android?: string; ios?: string; web?: string; default?: string };
  } | void
> = (config, _props) => {
  const props = _props || {};
  validate(schema, props);

  withExpoHeadIos(config);

  return {
    ...config,
    extra: {
      ...config.extra,
      router: {
        origin: false,
        ...config.extra?.router,
        ...props,
      },
    },
  };
};

export default withRouter;
