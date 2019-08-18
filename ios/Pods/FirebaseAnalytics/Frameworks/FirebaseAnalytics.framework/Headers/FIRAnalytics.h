#import <Foundation/Foundation.h>

#import "FIREventNames.h"
#import "FIRParameterNames.h"
#import "FIRUserPropertyNames.h"

NS_ASSUME_NONNULL_BEGIN

/// The top level Firebase Analytics singleton that provides methods for logging events and setting
/// user properties. See <a href="http://goo.gl/gz8SLz">the developer guides</a> for general
/// information on using Firebase Analytics in your apps.
NS_SWIFT_NAME(Analytics)
@interface FIRAnalytics : NSObject

/// Logs an app event. The event can have up to 25 parameters. Events with the same name must have
/// the same parameters. Up to 500 event names are supported. Using predefined events and/or
/// parameters is recommended for optimal reporting.
///
/// The following event names are reserved and cannot be used:
/// <ul>
///     <li>ad_activeview</li>
///     <li>ad_click</li>
///     <li>ad_exposure</li>
///     <li>ad_impression</li>
///     <li>ad_query</li>
///     <li>adunit_exposure</li>
///     <li>app_clear_data</li>
///     <li>app_remove</li>
///     <li>app_update</li>
///     <li>error</li>
///     <li>first_open</li>
///     <li>in_app_purchase</li>
///     <li>notification_dismiss</li>
///     <li>notification_foreground</li>
///     <li>notification_open</li>
///     <li>notification_receive</li>
///     <li>os_update</li>
///     <li>screen_view</li>
///     <li>session_start</li>
///     <li>user_engagement</li>
/// </ul>
///
/// @param name The name of the event. Should contain 1 to 40 alphanumeric characters or
///     underscores. The name must start with an alphabetic character. Some event names are
///     reserved. See FIREventNames.h for the list of reserved event names. The "firebase_",
///     "google_", and "ga_" prefixes are reserved and should not be used. Note that event names are
///     case-sensitive and that logging two events whose names differ only in case will result in
///     two distinct events.
/// @param parameters The dictionary of event parameters. Passing nil indicates that the event has
///     no parameters. Parameter names can be up to 40 characters long and must start with an
///     alphabetic character and contain only alphanumeric characters and underscores. Only NSString
///     and NSNumber (signed 64-bit integer and 64-bit floating-point number) parameter types are
///     supported. NSString parameter values can be up to 100 characters long. The "firebase_",
///     "google_", and "ga_" prefixes are reserved and should not be used for parameter names.
+ (void)logEventWithName:(NSString *)name
              parameters:(nullable NSDictionary<NSString *, id> *)parameters
    NS_SWIFT_NAME(logEvent(_:parameters:));

/// Sets a user property to a given value. Up to 25 user property names are supported. Once set,
/// user property values persist throughout the app lifecycle and across sessions.
///
/// The following user property names are reserved and cannot be used:
/// <ul>
///     <li>first_open_time</li>
///     <li>last_deep_link_referrer</li>
///     <li>user_id</li>
/// </ul>
///
/// @param value The value of the user property. Values can be up to 36 characters long. Setting the
///     value to nil removes the user property.
/// @param name The name of the user property to set. Should contain 1 to 24 alphanumeric characters
///     or underscores and must start with an alphabetic character. The "firebase_", "google_", and
///     "ga_" prefixes are reserved and should not be used for user property names.
+ (void)setUserPropertyString:(nullable NSString *)value forName:(NSString *)name
    NS_SWIFT_NAME(setUserProperty(_:forName:));

/// Sets the user ID property. This feature must be used in accordance with
/// <a href="https://www.google.com/policies/privacy">Google's Privacy Policy</a>
///
/// @param userID The user ID to ascribe to the user of this app on this device, which must be
///     non-empty and no more than 256 characters long. Setting userID to nil removes the user ID.
+ (void)setUserID:(nullable NSString *)userID;

/// Sets the current screen name, which specifies the current visual context in your app. This helps
/// identify the areas in your app where users spend their time and how they interact with your app.
/// Must be called on the main thread.
///
/// Note that screen reporting is enabled automatically and records the class name of the current
/// UIViewController for you without requiring you to call this method. If you implement
/// viewDidAppear in your UIViewController but do not call [super viewDidAppear:], that screen class
/// will not be automatically tracked. The class name can optionally be overridden by calling this
/// method in the viewDidAppear callback of your UIViewController and specifying the
/// screenClassOverride parameter. setScreenName:screenClass: must be called after
/// [super viewDidAppear:].
///
/// If your app does not use a distinct UIViewController for each screen, you should call this
/// method and specify a distinct screenName each time a new screen is presented to the user.
///
/// The screen name and screen class remain in effect until the current UIViewController changes or
/// a new call to setScreenName:screenClass: is made.
///
/// @param screenName The name of the current screen. Should contain 1 to 100 characters. Set to nil
///     to clear the current screen name.
/// @param screenClassOverride The name of the screen class. Should contain 1 to 100 characters. By
///     default this is the class name of the current UIViewController. Set to nil to revert to the
///     default class name.
+ (void)setScreenName:(nullable NSString *)screenName
          screenClass:(nullable NSString *)screenClassOverride;

/// Sets whether analytics collection is enabled for this app on this device. This setting is
/// persisted across app sessions. By default it is enabled.
///
/// @param analyticsCollectionEnabled A flag that enables or disables Analytics collection.
+ (void)setAnalyticsCollectionEnabled:(BOOL)analyticsCollectionEnabled;

/// Sets the interval of inactivity in seconds that terminates the current session. The default
/// value is 1800 seconds (30 minutes).
///
/// @param sessionTimeoutInterval The custom time of inactivity in seconds before the current
///     session terminates.
+ (void)setSessionTimeoutInterval:(NSTimeInterval)sessionTimeoutInterval;

/// The unique ID for this instance of the application.
+ (NSString *)appInstanceID;

/// Clears all analytics data for this instance from the device and resets the app instance ID.
/// FIRAnalyticsConfiguration values will be reset to the default values.
+ (void)resetAnalyticsData;

@end

NS_ASSUME_NONNULL_END
