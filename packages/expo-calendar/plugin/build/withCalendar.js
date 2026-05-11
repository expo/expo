"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const CALENDARS_WRITE_ONLY_USAGE = 'Allow $(PRODUCT_NAME) to add events to your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';
const withCalendar = (config, { calendarPermission, writeOnlyCalendarPermission, remindersPermission, writeOnlyAccess } = {}) => {
    const defaultDescriptions = {
        NSCalendarsUsageDescription: CALENDARS_USAGE,
        NSRemindersUsageDescription: REMINDERS_USAGE,
        NSRemindersFullAccessUsageDescription: REMINDERS_USAGE,
        ...(writeOnlyAccess
            ? { NSCalendarsWriteOnlyAccessUsageDescription: CALENDARS_WRITE_ONLY_USAGE }
            : {
                NSCalendarsFullAccessUsageDescription: CALENDARS_USAGE,
            }),
    };
    const customDescriptions = {
        NSCalendarsUsageDescription: calendarPermission,
        NSRemindersUsageDescription: remindersPermission,
        NSRemindersFullAccessUsageDescription: remindersPermission,
        ...(writeOnlyAccess
            ? { NSCalendarsWriteOnlyAccessUsageDescription: writeOnlyCalendarPermission }
            : {
                NSCalendarsFullAccessUsageDescription: calendarPermission,
            }),
    };
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin(defaultDescriptions)(config, customDescriptions);
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCalendar, pkg.name, pkg.version);
