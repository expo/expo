"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
// Hack to display the warning only once
const withIosWarning = (config, { property, warning }) => (0, config_plugins_1.withInfoPlist)(config, (config) => {
    config_plugins_1.WarningAggregator.addWarningIOS(property, warning);
    return config;
});
exports.default = withIosWarning;
