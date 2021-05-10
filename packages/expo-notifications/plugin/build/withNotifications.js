"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withNotificationsAndroid_1 = require("./withNotificationsAndroid");
const withNotificationsIOS_1 = require("./withNotificationsIOS");
const pkg = require('expo-notifications/package.json');
const withNotifications = config => {
    config = withNotificationsAndroid_1.withNotificationsAndroid(config);
    config = withNotificationsIOS_1.withNotificationsIOS(config, { mode: 'development' });
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withNotifications, pkg.name, pkg.version);
