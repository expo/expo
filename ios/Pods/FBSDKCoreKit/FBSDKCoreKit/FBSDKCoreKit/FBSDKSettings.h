// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <UIKit/UIKit.h>

/*
 * Constants defining logging behavior.  Use with <[FBSDKSettings setLoggingBehavior]>.
 */

/** Include access token in logging. */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorAccessTokens;

/** Log performance characteristics */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorPerformanceCharacteristics;

/** Log FBSDKAppEvents interactions */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorAppEvents;

/** Log Informational occurrences */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorInformational;

/** Log cache errors. */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorCacheErrors;

/** Log errors from SDK UI controls */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorUIControlErrors;

/** Log debug warnings from API response, i.e. when friends fields requested, but user_friends permission isn't granted. */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorGraphAPIDebugWarning;

/** Log warnings from API response, i.e. when requested feature will be deprecated in next version of API.
 Info is the lowest level of severity, using it will result in logging all previously mentioned levels.
 */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorGraphAPIDebugInfo;

/** Log errors from SDK network requests */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorNetworkRequests;

/** Log errors likely to be preventable by the developer. This is in the default set of enabled logging behaviors. */
FOUNDATION_EXPORT NSString *const FBSDKLoggingBehaviorDeveloperErrors;

@interface FBSDKSettings : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  Get the Facebook App ID used by the SDK.

 If not explicitly set, the default will be read from the application's plist (FacebookAppID).
 */
+ (NSString *)appID;

/**
  Set the Facebook App ID to be used by the SDK.
 @param appID The Facebook App ID to be used by the SDK.
 */
+ (void)setAppID:(NSString *)appID;

/**
  Get the default url scheme suffix used for sessions.

 If not explicitly set, the default will be read from the application's plist (FacebookUrlSchemeSuffix).
 */
+ (NSString *)appURLSchemeSuffix;

/**
  Set the app url scheme suffix used by the SDK.
 @param appURLSchemeSuffix The url scheme suffix to be used by the SDK.
 */
+ (void)setAppURLSchemeSuffix:(NSString *)appURLSchemeSuffix;

/**
  Retrieve the Client Token that has been set via [FBSDKSettings setClientToken].

 If not explicitly set, the default will be read from the application's plist (FacebookClientToken).
 */
+ (NSString *)clientToken;

/**
  Sets the Client Token for the Facebook App.

 This is needed for certain API calls when made anonymously, without a user-based access token.
 @param clientToken The Facebook App's "client token", which, for a given appid can be found in the Security
 section of the Advanced tab of the Facebook App settings found at <https://developers.facebook.com/apps/[your-app-id]>
 */
+ (void)setClientToken:(NSString *)clientToken;

/**
  A convenient way to toggle error recovery for all FBSDKGraphRequest instances created after this is set.
 @param disableGraphErrorRecovery YES or NO.
 */
+ (void)setGraphErrorRecoveryDisabled:(BOOL)disableGraphErrorRecovery;

/**
  Get the Facebook Display Name used by the SDK.

 If not explicitly set, the default will be read from the application's plist (FacebookDisplayName).
 */
+ (NSString *)displayName;

/**
  Set the default Facebook Display Name to be used by the SDK.

  This should match the Display Name that has been set for the app with the corresponding Facebook App ID,
 in the Facebook App Dashboard.
 @param displayName The Facebook Display Name to be used by the SDK.
 */
+ (void)setDisplayName:(NSString *)displayName;

/**
  Get the Facebook domain part.

 If not explicitly set, the default will be read from the application's plist (FacebookDomainPart).
 */
+ (NSString *)facebookDomainPart;

/**
  Set the subpart of the Facebook domain.

 This can be used to change the Facebook domain (e.g. @"beta") so that requests will be sent to
 graph.beta.facebook.com
 @param facebookDomainPart The domain part to be inserted into facebook.com.
 */
+ (void)setFacebookDomainPart:(NSString *)facebookDomainPart;

/**
  The quality of JPEG images sent to Facebook from the SDK.

 If not explicitly set, the default is 0.9.

 @see [UIImageJPEGRepresentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIKitFunctionReference/#//apple_ref/c/func/UIImageJPEGRepresentation) */
+ (CGFloat)JPEGCompressionQuality;

/**
  Set the quality of JPEG images sent to Facebook from the SDK.
 @param JPEGCompressionQuality The quality for JPEG images, expressed as a value from 0.0 to 1.0.

 @see [UIImageJPEGRepresentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIKitFunctionReference/#//apple_ref/c/func/UIImageJPEGRepresentation) */
+ (void)setJPEGCompressionQuality:(CGFloat)JPEGCompressionQuality;

/**
  Flag which controls the auto logging of basic app events, such as activateApp and deactivateApp.
 If not explicitly set, the default is 1 - true
 */
+ (NSNumber *)autoLogAppEventsEnabled;

/**
 Set the flag which controls the auto logging of basic app events, such as activateApp and deactivateApp.
 @param AutoLogAppEventsEnabled Flag value, expressed as a value from 0 - false or 1 - true.
 */
+ (void)setAutoLogAppEventsEnabled:(NSNumber *)AutoLogAppEventsEnabled;

/**
 Flag which controls the fb_codeless_debug logging event
 If not explicitly set, the default is 1 - true
 */
+ (NSNumber *)codelessDebugLogEnabled;

/**
 Set the flag which controls the fb_codeless_debug logging event
 @param CodelessDebugLogEnabled Flag value, expressed as a value from 0 - false or 1 - true.
 */
+ (void)setCodelessDebugLogEnabled:(NSNumber *)CodelessDebugLogEnabled;

/**
  Gets whether data such as that generated through FBSDKAppEvents and sent to Facebook should be restricted from being used for other than analytics and conversions.  Defaults to NO.  This value is stored on the device and persists across app launches.
 */
+ (BOOL)limitEventAndDataUsage;

/**
  Sets whether data such as that generated through FBSDKAppEvents and sent to Facebook should be restricted from being used for other than analytics and conversions.  Defaults to NO.  This value is stored on the device and persists across app launches.

 @param limitEventAndDataUsage   The desired value.
 */
+ (void)setLimitEventAndDataUsage:(BOOL)limitEventAndDataUsage;

/**
  Retrieve the current iOS SDK version.
 */
+ (NSString *)sdkVersion;

/**
  Retrieve the current Facebook SDK logging behavior.
 */
+ (NSSet *)loggingBehavior;

/**
  Set the current Facebook SDK logging behavior.  This should consist of strings defined as
 constants with FBSDKLoggingBehavior*.

 @param loggingBehavior A set of strings indicating what information should be logged.  If nil is provided, the logging
 behavior is reset to the default set of enabled behaviors.  Set to an empty set in order to disable all logging.


 You can also define this via an array in your app plist with key "FacebookLoggingBehavior" or add and remove individual values via enableLoggingBehavior: or disableLogginBehavior:
 */
+ (void)setLoggingBehavior:(NSSet *)loggingBehavior;

/**
  Enable a particular Facebook SDK logging behavior.

 @param loggingBehavior The LoggingBehavior to enable. This should be a string defined as a constant with FBSDKLoggingBehavior*.
 */
+ (void)enableLoggingBehavior:(NSString *)loggingBehavior;

/**
  Disable a particular Facebook SDK logging behavior.

 @param loggingBehavior The LoggingBehavior to disable. This should be a string defined as a constant with FBSDKLoggingBehavior*.
 */
+ (void)disableLoggingBehavior:(NSString *)loggingBehavior;

/**
  Set the user defaults key used by legacy token caches.

 @param tokenInformationKeyName the key used by legacy token caches.


 Use this only if you customized FBSessionTokenCachingStrategy in v3.x of
  the Facebook SDK for iOS.
*/
+ (void)setLegacyUserDefaultTokenInformationKeyName:(NSString *)tokenInformationKeyName;

/**
  Get the user defaults key used by legacy token caches.
*/
+ (NSString *)legacyUserDefaultTokenInformationKeyName;

/**
  Overrides the default Graph API version to use with `FBSDKGraphRequests`. This overrides `FBSDK_TARGET_PLATFORM_VERSION`.

 The string should be of the form `@"v2.7"`.
*/
+ (void)setGraphAPIVersion:(NSString *)version;

/**
  Returns the default Graph API version. Defaults to `FBSDK_TARGET_PLATFORM_VERSION`
*/
+ (NSString *)graphAPIVersion;

@end
