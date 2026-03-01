"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withShareIntoSchemeString = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withShareIntoSchemeString = (config, scheme) => {
    return (0, config_plugins_1.withStringsXml)(config, (config) => {
        config.modResults = config_plugins_1.AndroidConfig.Strings.setStringItem([
            config_plugins_1.AndroidConfig.Resources.buildResourceItem({
                name: 'share_into_scheme',
                value: scheme,
                translatable: false,
            }),
        ], config.modResults);
        return config;
    });
};
exports.withShareIntoSchemeString = withShareIntoSchemeString;
