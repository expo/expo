"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidGradleEdgeToEdgeProperty = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withAndroidGradleEdgeToEdgeProperty = (config) => {
    const comment = {
        type: 'comment',
        value: 'Enable edge-to-edge',
    };
    return (0, config_plugins_1.withGradleProperties)(config, async (config) => {
        const { experiments = {} } = config;
        const { edgeToEdge = false } = experiments;
        const property = {
            type: 'property',
            key: 'edgeToEdgeEnabled',
            value: String(edgeToEdge),
        };
        const currentIndex = config.modResults.findIndex((item) => item.type === 'property' && item.key === property.key);
        if (currentIndex > -1) {
            config.modResults[currentIndex] = property;
        }
        else {
            config.modResults.push(comment, property);
        }
        return config;
    });
};
exports.withAndroidGradleEdgeToEdgeProperty = withAndroidGradleEdgeToEdgeProperty;
