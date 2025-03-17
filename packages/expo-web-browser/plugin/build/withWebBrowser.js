"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withWebBrowserAndroid_1 = require("./withWebBrowserAndroid");
const pkg = require('expo-web-browser/package.json');
const withWebBrowser = (config, props) => {
    if (!props) {
        return config;
    }
    if (!props.experimentalLauncherActivity) {
        return config;
    }
    return (0, withWebBrowserAndroid_1.withWebBrowserAndroid)(config);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withWebBrowser, pkg.name, pkg.version);
