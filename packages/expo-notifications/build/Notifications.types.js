/**
 * Schedulable trigger inputs (that are not a plain date value or time value)
 * must have the "type" property set to one of these values.
 */
export var SchedulableTriggerInputTypes;
(function (SchedulableTriggerInputTypes) {
    SchedulableTriggerInputTypes["CALENDAR"] = "calendar";
    SchedulableTriggerInputTypes["DAILY"] = "daily";
    SchedulableTriggerInputTypes["WEEKLY"] = "weekly";
    SchedulableTriggerInputTypes["MONTHLY"] = "monthly";
    SchedulableTriggerInputTypes["YEARLY"] = "yearly";
    SchedulableTriggerInputTypes["DATE"] = "date";
    SchedulableTriggerInputTypes["TIME_INTERVAL"] = "timeInterval";
})(SchedulableTriggerInputTypes || (SchedulableTriggerInputTypes = {}));
/**
 * An enum corresponding to values appropriate for Android's [`Notification#priority`](https://developer.android.com/reference/android/app/Notification#priority) field.
 * @platform android
 */
export var AndroidNotificationPriority;
(function (AndroidNotificationPriority) {
    AndroidNotificationPriority["MIN"] = "min";
    AndroidNotificationPriority["LOW"] = "low";
    AndroidNotificationPriority["DEFAULT"] = "default";
    AndroidNotificationPriority["HIGH"] = "high";
    AndroidNotificationPriority["MAX"] = "max";
})(AndroidNotificationPriority || (AndroidNotificationPriority = {}));
export { PermissionStatus, } from 'expo-modules-core';
//# sourceMappingURL=Notifications.types.js.map