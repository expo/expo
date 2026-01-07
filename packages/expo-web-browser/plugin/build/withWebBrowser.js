"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-web-browser/package.json');
const withWebBrowser = (config, props) => {
    if (props?.experimentalLauncherActivity) {
        console.warn('The `experimentalLauncherActivity` option has been removed. To achieve similar behaviour, set both `createTask` and `useProxyActivity` to true when using `openBrowserAsync` or `openAuthSessionAsync`.');
        return config;
    }
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withWebBrowser, pkg.name, pkg.version);
