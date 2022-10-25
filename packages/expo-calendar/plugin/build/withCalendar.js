"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-calendar/package.json');
const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';
const withCalendar = (config, { calendarPermission, remindersPermission } = {}) => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSCalendarsUsageDescription =
        calendarPermission || config.ios.infoPlist.NSCalendarsUsageDescription || CALENDARS_USAGE;
    config.ios.infoPlist.NSRemindersUsageDescription =
        remindersPermission || config.ios.infoPlist.NSRemindersUsageDescription || REMINDERS_USAGE;
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCalendar, pkg.name, pkg.version);
