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

NS_ASSUME_NONNULL_BEGIN

/*
 * Constants defining logging behavior.  Use with <[FBSDKSettings setLoggingBehavior]>.
 */

/// typedef for FBSDKAppEventName
typedef NSString *const FBSDKLoggingBehavior NS_TYPED_EXTENSIBLE_ENUM NS_SWIFT_NAME(LoggingBehavior);

/** Include access token in logging. */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorAccessTokens;

/** Log performance characteristics */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorPerformanceCharacteristics;

/** Log FBSDKAppEvents interactions */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorAppEvents;

/** Log Informational occurrences */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorInformational;

/** Log cache errors. */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorCacheErrors;

/** Log errors from SDK UI controls */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorUIControlErrors;

/** Log debug warnings from API response, i.e. when friends fields requested, but user_friends permission isn't granted. */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorGraphAPIDebugWarning;

/** Log warnings from API response, i.e. when requested feature will be deprecated in next version of API.
 Info is the lowest level of severity, using it will result in logging all previously mentioned levels.
 */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorGraphAPIDebugInfo;

/** Log errors from SDK network requests */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorNetworkRequests;

/** Log errors likely to be preventable by the developer. This is in the default set of enabled logging behaviors. */
FOUNDATION_EXPORT FBSDKLoggingBehavior FBSDKLoggingBehaviorDeveloperErrors;

NS_SWIFT_NAME(Settings)
@interface FBSDKSettings : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 Retrieve the current iOS SDK version.
 */
@property (class, nonatomic, copy, readonly) NSString *sdkVersion;

/**
 Retrieve the current default Graph API version.
 */
@property (class, nonatomic, copy, readonly) NSString *defaultGraphAPIVersion;

/**
 The quality of JPEG images sent to Facebook from the SDK,
 expressed as a value from 0.0 to 1.0.

 If not explicitly set, the default is 0.9.

 @see [UIImageJPEGRepresentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIKitFunctionReference/#//apple_ref/c/func/UIImageJPEGRepresentation) */
@property (class, nonatomic, assign) CGFloat JPEGCompressionQuality
NS_SWIFT_NAME(jpegCompressionQuality);

/**
 Controls sdk auto initailization.
 If not explicitly set, the default is true
 */
@property (class, nonatomic, assign, getter=isAutoInitEnabled) BOOL autoInitEnabled;

/**
 Controls sdk crash report
 If not explicitly set, the default is true
 */
@property (class, nonatomic, assign, getter=isInstrumentEnabled) BOOL instrumentEnabled
__attribute((deprecated("This attribute is no longer used, use autoLogAppEventsEnabled instead.")));

/**
 Controls the auto logging of basic app events, such as activateApp and deactivateApp.
 If not explicitly set, the default is true
 */
@property (class, nonatomic, assign, getter=isAutoLogAppEventsEnabled) BOOL autoLogAppEventsEnabled;

/**
 Controls the fb_codeless_debug logging event
 If not explicitly set, the default is true
 */
@property (class, nonatomic, assign, getter=isCodelessDebugLogEnabled) BOOL codelessDebugLogEnabled;

/**
 Controls the fb_codeless_debug logging event
 If not explicitly set, the default is true
 */
@property (class, nonatomic, assign, getter=isAdvertiserIDCollectionEnabled) BOOL advertiserIDCollectionEnabled;

/**
 Whether data such as that generated through FBSDKAppEvents and sent to Facebook
 should be restricted from being used for other than analytics and conversions.
 Defaults to NO. This value is stored on the device and persists across app launches.
 */
@property (class, nonatomic, assign, getter=shouldLimitEventAndDataUsage) BOOL limitEventAndDataUsage;

/**
 A convenient way to toggle error recovery for all FBSDKGraphRequest instances created after this is set.
 */
@property (class, nonatomic, assign, getter=isGraphErrorRecoveryEnabled) BOOL graphErrorRecoveryEnabled;

/**
  The Facebook App ID used by the SDK.

 If not explicitly set, the default will be read from the application's plist (FacebookAppID).
 */
@property (class, nonatomic, copy, null_resettable) NSString *appID;

/**
  The default url scheme suffix used for sessions.

 If not explicitly set, the default will be read from the application's plist (FacebookUrlSchemeSuffix).
 */
@property (class, nonatomic, copy, null_resettable) NSString *appURLSchemeSuffix;

/**
  The Client Token that has been set via [FBSDKSettings setClientToken].
 This is needed for certain API calls when made anonymously, without a user-based access token.

 The Facebook App's "client token", which, for a given appid can be found in the Security
 section of the Advanced tab of the Facebook App settings found at <https://developers.facebook.com/apps/[your-app-id]>

 If not explicitly set, the default will be read from the application's plist (FacebookClientToken).
 */
@property (class, nonatomic, copy, null_resettable) NSString *clientToken;

/**
  The Facebook Display Name used by the SDK.

 This should match the Display Name that has been set for the app with the corresponding Facebook App ID,
 in the Facebook App Dashboard.

 If not explicitly set, the default will be read from the application's plist (FacebookDisplayName).
 */
@property (class, nonatomic, copy, null_resettable) NSString *displayName;

/**
 The Facebook domain part. This can be used to change the Facebook domain
 (e.g. @"beta") so that requests will be sent to `graph.beta.facebook.com`

 If not explicitly set, the default will be read from the application's plist (FacebookDomainPart).
 */
@property (class, nonatomic, copy, null_resettable) NSString *facebookDomainPart;

/**
  The current Facebook SDK logging behavior. This should consist of strings
 defined as constants with FBSDKLoggingBehavior*.

 This should consist a set of strings indicating what information should be logged
 defined as constants with FBSDKLoggingBehavior*. Set to an empty set in order to disable all logging.

 You can also define this via an array in your app plist with key "FacebookLoggingBehavior" or add and remove individual values via enableLoggingBehavior: or disableLogginBehavior:

 The default is a set consisting of FBSDKLoggingBehaviorDeveloperErrors
 */
@property (class, nonatomic, copy) NSSet<FBSDKLoggingBehavior> *loggingBehaviors
NS_REFINED_FOR_SWIFT;

/**
  Overrides the default Graph API version to use with `FBSDKGraphRequests`. This overrides `FBSDK_TARGET_PLATFORM_VERSION`.

 The string should be of the form `@"v2.7"`.

 Defaults to `FBSDK_TARGET_PLATFORM_VERSION`.
*/
@property (class, nonatomic, copy, null_resettable) NSString *graphAPIVersion;

/**
 Enable a particular Facebook SDK logging behavior.

 @param loggingBehavior The LoggingBehavior to enable. This should be a string defined as a constant with FBSDKLoggingBehavior*.
 */
+ (void)enableLoggingBehavior:(FBSDKLoggingBehavior)loggingBehavior;

/**
 Disable a particular Facebook SDK logging behavior.

 @param loggingBehavior The LoggingBehavior to disable. This should be a string defined as a constant with FBSDKLoggingBehavior*.
 */
+ (void)disableLoggingBehavior:(FBSDKLoggingBehavior)loggingBehavior;

@end

NS_ASSUME_NONNULL_END
