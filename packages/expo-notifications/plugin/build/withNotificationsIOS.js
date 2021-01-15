"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNotificationsIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
exports.withNotificationsIOS = (config, { mode }) => {
    return config_plugins_1.withEntitlementsPlist(config, config => {
        config.modResults['aps-environment'] = mode;
        return config;
    });
};
