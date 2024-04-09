"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-calendar/package.json');
const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';
const withCalendar = (config, { calendarPermission, remindersPermission } = {}) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSCalendarsUsageDescription =
            calendarPermission || config.modResults.NSCalendarsUsageDescription || CALENDARS_USAGE;
        config.modResults.NSRemindersUsageDescription =
            remindersPermission || config.modResults.NSRemindersUsageDescription || REMINDERS_USAGE;
        config.modResults.NSCalendarsFullAccessUsageDescription =
            calendarPermission ||
                config.modResults.NSCalendarsFullAccessUsageDescription ||
                CALENDARS_USAGE;
        config.modResults.NSRemindersFullAccessUsageDescription =
            remindersPermission ||
                config.modResults.NSRemindersFullAccessUsageDescription ||
                REMINDERS_USAGE;
        return config;
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCalendar, pkg.name, pkg.version);
