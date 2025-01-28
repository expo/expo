"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const schema_utils_1 = require("schema-utils");
const schema = require('../options.json');
const withExpoHeadIos = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
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
const withRouter = (config, _props) => {
    const props = _props || {};
    (0, schema_utils_1.validate)(schema, props);
    withExpoHeadIos(config);
    return {
        ...config,
        extra: {
            ...config.extra,
            router: {
                ...config.extra?.router,
                ...props,
            },
        },
    };
};
exports.default = withRouter;
