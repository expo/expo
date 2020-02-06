/**
 * Logs an app event. The event can have up to 25 parameters. Events with the same name must have
 * the same parameters. Up to 500 event names are supported. Using predefined events and/or
 * parameters is recommended for optimal reporting.
 *
 * The following event names are reserved and cannot be used:
 * - `ad_activeview`
 * - `ad_click`
 * - `ad_exposure`
 * - `ad_impression`
 * - `ad_query`
 * - `adunit_exposure`
 * - `app_clear_data`
 * - `app_remove`
 * - `app_update`
 * - `error`
 * - `first_open`
 * - `in_app_purchase`
 * - `notification_dismiss`
 * - `notification_foreground`
 * - `notification_open`
 * - `notification_receive`
 * - `os_update`
 * - `screen_view`
 * - `session_start`
 * - `user_engagement`
 *
 * @param name The name of the event. Should contain 1 to 40 alphanumeric characters or
 *     underscores. The name must start with an alphabetic character. Some event names are
 *     reserved. The "firebase_",
 *     "google_", and "ga_" prefixes are reserved and should not be used. Note that event names are
 *     case-sensitive and that logging two events whose names differ only in case will result in
 *     two distinct events.
 * @param parameters The dictionary of event parameters. Passing `undefined` indicates that the event has
 *     no parameters. Parameter names can be up to 40 characters long and must start with an
 *     alphabetic character and contain only alphanumeric characters and underscores. Only `String`
 *     and `Number` (signed 64-bit integer and 64-bit floating-point number) parameter types are
 *     supported. `String` parameter values can be up to 100 characters long. The "firebase_",
 *     "google_", and "ga_" prefixes are reserved and should not be used for parameter names.
 */
export declare function logEvent(name: string, properties?: {
    [key: string]: any;
}): Promise<void>;
/**
 * Sets whether analytics collection is enabled for this app on this device. This setting is
 * persisted across app sessions. By default it is enabled.
 *
 * @param isEnabled A flag that enables or disables Analytics collection.
 */
export declare function setAnalyticsCollectionEnabled(isEnabled: boolean): Promise<void>;
/**
 * Sets the current screen name, which specifies the current visual context in your app. This helps
 * identify the areas in your app where users spend their time and how they interact with your app.
 *
 * @param screenName The name of the current screen. Should contain 1 to 100 characters. Set to `undefined`
 *     to clear the current screen name.
 * @param screenClassOverride The name of the screen class. Should contain 1 to 100 characters. By
 *     default this is the class name of the current screen (UIViewController on iOS). Set to `undefined` to revert to the
 *     default class name.
 */
export declare function setCurrentScreen(screenName?: string, screenClassOverride?: string): Promise<void>;
/**
 * Sets the interval of inactivity in seconds that terminates the current session. The default
 * value is 1800000 milliseconds (30 minutes).
 *
 * @param sessionTimeoutInterval The custom time of inactivity in milliseconds before the current
 *     session terminates.
 */
export declare function setSessionTimeoutDuration(sessionTimeoutInterval: number): Promise<void>;
/**
 * Sets the user ID property. This feature must be used in accordance with
 * [Google's Privacy Policy](https://www.google.com/policies/privacy)
 *
 * @param userID The user ID to ascribe to the user of this app on this device, which must be
 *     non-empty and no more than 256 characters long. Setting userID to null removes the user ID.
 */
export declare function setUserId(userId: string | null): Promise<void>;
/**
 * Sets a user property to a given value. Up to 25 user property names are supported. Once set,
 * user property values persist throughout the app life-cycle and across sessions.
 *
 * The following user property names are reserved and cannot be used:
 *
 * - `first_open_time`
 * - `last_deep_link_referrer`
 * - `user_id`
 *
 * @param name The name of the user property to set. Should contain 1 to 24 alphanumeric characters
 *     or underscores and must start with an alphabetic character. The "firebase_", "google_", and
 *     "ga_" prefixes are reserved and should not be used for user property names.
 * @param value The value of the user property. Values can be up to 36 characters long. Setting the
 *     value to null removes the user property.
 */
export declare function setUserProperty(name: string, value: string): Promise<void>;
/**
 * Clears all analytics data for this instance from the device and resets the app instance ID.
 */
export declare function resetAnalyticsData(): Promise<void>;
/**
 * Sets multiple user properties to the supplied values.
 *
 * @param properties key/value set of user properties
 */
export declare function setUserProperties(properties: {
    [key: string]: string;
}): Promise<void>;
/**
 * Enables or disables the warning and log messages when using
 * Firebase Analytics on the Expo client.
 *
 * Firebase Analytics is not available on the Expo client and therefore
 * logs the requests to the console for development purposes. To test
 * Firebase Analytics, create a stand-alone build or custom client.
 * Use this function to suppress the warning and log messages.
 *
 * @param properties key/value set of user properties
 */
export declare function setUnavailabilityLogging(isEnabled: boolean): void;
