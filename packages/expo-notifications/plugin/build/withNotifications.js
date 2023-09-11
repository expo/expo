"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withNotificationsAndroid_1 = require("./withNotificationsAndroid");
const withNotificationsIOS_1 = require("./withNotificationsIOS");
const pkg = require('expo-notifications/package.json');
const withNotifications = (config, props) => {
    config = (0, withNotificationsAndroid_1.withNotificationsAndroid)(config, props || {});
    config = (0, withNotificationsIOS_1.withNotificationsIOS)(config, props || {});
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withNotifications, pkg.name, pkg.version);
