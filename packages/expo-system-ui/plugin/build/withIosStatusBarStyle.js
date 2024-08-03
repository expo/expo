"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosStatusBarStyle = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withIosStatusBarStyle = (config) => (0, config_plugins_1.withInfoPlist)(config, (config) => {
    const { experiments = {}, userInterfaceStyle = 'automatic' } = config;
    const { edgeToEdge = false } = experiments;
    const styles = {
        automatic: 'UIStatusBarStyleDefault',
        dark: 'UIStatusBarStyleLightContent',
        light: 'UIStatusBarStyleDarkContent',
    };
    config.modResults['UIStatusBarStyle'] = edgeToEdge
        ? styles[userInterfaceStyle]
        : styles['automatic'];
    return config;
});
exports.withIosStatusBarStyle = withIosStatusBarStyle;
