/**
 * Schedulable trigger inputs (that are not a plain Date value or time value)
 * must have the "type" property set to one of these values.
 */
export var CalendarTriggerTypes;
(function (CalendarTriggerTypes) {
    /**
     * A trigger type that will cause the notification to be delivered once or many times
     * (controlled by the value of `repeats`)
     * when the date components match the specified values.
     * Corresponds to native
     * [`UNCalendarNotificationTrigger`](https://developer.apple.com/documentation/usernotifications/uncalendarnotificationtrigger?language=objc).
     * @platform ios
     */
    CalendarTriggerTypes["CALENDAR"] = "calendar";
    /**
     * A trigger type that will cause the notification to be delivered once per day
     * when the `hour` and `minute` date components match the specified values.
     */
    CalendarTriggerTypes["DAILY"] = "daily";
    /**
     * A trigger type that will cause the notification to be delivered once every week
     * when the `weekday`, `hour`, and `minute` date components match the specified values.
     * > **Note:** Weekdays are specified with a number from `1` through `7`, with `1` indicating Sunday.
     */
    CalendarTriggerTypes["WEEKLY"] = "weekly";
    /**
     * A trigger type that will cause the notification to be delivered once every year
     * when the `day`, `month`, `hour`, and `minute` date components match the specified values.
     * > **Note:** all properties are specified in JavaScript Date's ranges.
     */
    CalendarTriggerTypes["YEARLY"] = "yearly";
    /**
     * A trigger type that will cause the notification to be delivered once
     * on the specified value of the `date` property. The value of `repeats` will be ignored
     * for this trigger type.
     */
    CalendarTriggerTypes["DATE"] = "date";
    /**
     * A trigger of this type will cause the notification to be delivered once or many times
     * (depends on the `repeats` field) after `seconds` time elapse.
     * > **On iOS**, when `repeats` is `true`, the time interval must be 60 seconds or greater.
     * Otherwise, the notification won't be triggered.
     */
    CalendarTriggerTypes["TIME_INTERVAL"] = "timeInterval";
})(CalendarTriggerTypes || (CalendarTriggerTypes = {}));
/**
 * An enum corresponding to values appropriate for Android's [`Notification#priority`](https://developer.android.com/reference/android/app/Notification#priority) field.
 */
export var AndroidNotificationPriority;
(function (AndroidNotificationPriority) {
    AndroidNotificationPriority["MIN"] = "min";
    AndroidNotificationPriority["LOW"] = "low";
    AndroidNotificationPriority["DEFAULT"] = "default";
    AndroidNotificationPriority["HIGH"] = "high";
    AndroidNotificationPriority["MAX"] = "max";
})(AndroidNotificationPriority || (AndroidNotificationPriority = {}));
//# sourceMappingURL=Notifications.types.js.map