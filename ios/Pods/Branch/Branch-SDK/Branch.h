//
//  Branch_SDK.h
//  Branch-SDK
//
//  Created by Alex Austin on 6/5/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#import "BNCCallbacks.h"
#import "BNCCommerceEvent.h"
#import "BNCConfig.h"
#import "BNCDebug.h"
#import "NSError+Branch.h"
#import "BNCLinkCache.h"
#import "BNCLog.h"
#import "BNCPreferenceHelper.h"
#import "BNCServerInterface.h"
#import "BNCServerRequestQueue.h"
#import "BNCAvailability.h"
#import "BranchConstants.h"
#import "BranchDeepLinkingController.h"
#import "BranchEvent.h"
#import "BranchLinkProperties.h"
#import "BranchDelegate.h"
#import "BranchUniversalObject.h"
#import "BranchCrossPlatformID.h"
#import "BranchLastAttributedTouchData.h"
#import "BNCInitSessionResponse.h"
#import "UIViewController+Branch.h"
#import "BranchScene.h"

#if !TARGET_OS_TV
// tvOS does not support these features
#import "BranchShareLink.h"
#import "BranchActivityItemProvider.h"
#import "BranchCSSearchableItemAttributeSet.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 `Branch` is the primary interface of the Branch iOS SDK. Currently, all interactions you will make are funneled through this class. It is not meant to be instantiated or subclassed, usage should be limited to the global instance.

  Note, when `getInstance` is called, it assumes that you have already placed a Branch Key in your main `Info.plist` file for your project. For additional information on configuring the Branch SDK, check out the getting started guides in the Readme.
 */

///----------------
/// @name Constants
///----------------

#pragma mark Branch Link Features

/**
 ## Branch Link Features
 The following are constants used for specifying a feature parameter on a call that creates a Branch link.

 `BRANCH_FEATURE_SHARE`
 Indicates this link was used for sharing content. Used by the `getContentUrl` methods.

 `BRANCH_FEATURE_TAG_REFERRAL`
 Indicates this link was used to refer users to this app. Used by the `getReferralUrl` methods.

 `BRANCH_FEATURE_TAG_INVITE`
 Indicates this link is used as an invitation.

 `BRANCH_FEATURE_TAG_DEAL`
 Indicates this link is being used to trigger a deal, like a discounted rate.

 `BRANCH_FEATURE_TAG_GIFT`
 Indicates this link is being used to send a gift to another user.
 */
extern NSString * __nonnull const BRANCH_FEATURE_TAG_SHARE;
extern NSString * __nonnull const BRANCH_FEATURE_TAG_REFERRAL;
extern NSString * __nonnull const BRANCH_FEATURE_TAG_INVITE;
extern NSString * __nonnull const BRANCH_FEATURE_TAG_DEAL;
extern NSString * __nonnull const BRANCH_FEATURE_TAG_GIFT;

#pragma mark - Branch InitSession Dictionary Constants

/**
 ## Branch Link Features

 `BRANCH_INIT_KEY_CHANNEL`
 The channel on which the link was shared, specified at link creation time.

 `BRANCH_INIT_KEY_FEATURE`
 The feature, such as `invite` or `share`, specified at link creation time.

 `BRANCH_INIT_KEY_TAGS`
 Any tags, specified at link creation time.

 `BRANCH_INIT_KEY_CAMPAIGN`
 The campaign the link is associated with, specified at link creation time.

 `BRANCH_INIT_KEY_STAGE`
 The stage, specified at link creation time.

 `BRANCH_INIT_KEY_CREATION_SOURCE`
 Where the link was created ('API', 'Dashboard', 'SDK', 'iOS SDK', 'Android SDK', or 'Web SDK')

 `BRANCH_INIT_KEY_REFERRER`
 The referrer for the link click, if a link was clicked.

 `BRANCH_INIT_KEY_PHONE_NUMBER`
 The phone number of the user, if the user texted himself/herself the app.

 `BRANCH_INIT_KEY_IS_FIRST_SESSION`
 Denotes whether this is the first session (install) or any other session (open).

 `BRANCH_INIT_KEY_CLICKED_BRANCH_LINK`
 Denotes whether or not the user clicked a Branch link that triggered this session.
 */
extern NSString * __nonnull const BRANCH_INIT_KEY_CHANNEL;
extern NSString * __nonnull const BRANCH_INIT_KEY_FEATURE;
extern NSString * __nonnull const BRANCH_INIT_KEY_TAGS;
extern NSString * __nonnull const BRANCH_INIT_KEY_CAMPAIGN;
extern NSString * __nonnull const BRANCH_INIT_KEY_STAGE;
extern NSString * __nonnull const BRANCH_INIT_KEY_CREATION_SOURCE;
extern NSString * __nonnull const BRANCH_INIT_KEY_REFERRER;
extern NSString * __nonnull const BRANCH_INIT_KEY_PHONE_NUMBER;
extern NSString * __nonnull const BRANCH_INIT_KEY_IS_FIRST_SESSION;
extern NSString * __nonnull const BRANCH_INIT_KEY_CLICKED_BRANCH_LINK;

// BUO Constants
extern NSString * __nonnull const BNCCanonicalIdList;
extern NSString * __nonnull const BNCPurchaseAmount;
extern NSString * __nonnull const BNCPurchaseCurrency;
extern NSString * __nonnull const BNCCanonicalIdList;
extern NSString * __nonnull const BNCRegisterViewEvent;
extern NSString * __nonnull const BNCAddToWishlistEvent;
extern NSString * __nonnull const BNCAddToCartEvent;
extern NSString * __nonnull const BNCPurchaseInitiatedEvent;
extern NSString * __nonnull const BNCPurchasedEvent;
extern NSString * __nonnull const BNCShareInitiatedEvent;
extern NSString * __nonnull const BNCShareCompletedEvent;

// Spotlight Constant
extern NSString * __nonnull const BNCSpotlightFeature;

#pragma mark - Branch Enums
typedef NS_ENUM(NSUInteger, BranchCreditHistoryOrder) {
    BranchMostRecentFirst,
    BranchLeastRecentFirst
};

#pragma mark - BranchLink

@interface BranchLink : NSObject
@property (nonatomic, strong, nullable) BranchUniversalObject *universalObject;
@property (nonatomic, strong, nullable) BranchLinkProperties  *linkProperties;
+ (nullable BranchLink *) linkWithUniversalObject:(nullable BranchUniversalObject *)universalObject properties:(nullable BranchLinkProperties *)linkProperties;
@end

#pragma mark - Branch

@interface Branch : NSObject

#pragma mark Global Instance Accessors

///--------------------------------
/// @name Global Instance Accessors
///--------------------------------

/**
 Gets the global, test Branch instance.

 @warning This method is not meant to be used in production!
*/
+ (Branch *)getTestInstance __attribute__((deprecated(("Use `Branch.useTestBranchKey = YES;` instead."))));


/**
 Gets the global, live Branch instance.
 */
+ (Branch *)getInstance;

/**
 Gets the global Branch instance, configures using the specified key

 @param branchKey The Branch key to be used by the Branch instance. This can be any live or test key.
 @warning This method is not the recommended way of using Branch. Try using your project's `Info.plist` if possible.
 */
+ (Branch *)getInstance:(NSString *)branchKey;

/**
 Set the network service class.

 The class must conform to the `BNCNetworkServiceProtocol` and be a drop in replacement for the
 standard Branch SDK networking.

 This allows the use of Branch SDK with your own apps network service.

 The NetworkServiceClass can be set only once, before the Branch SDK initialization.

 @param networkServiceClass     The class to use as the network service class.
*/
+ (void)setNetworkServiceClass:(Class)networkServiceClass;

/**
 Return the Branch SDK network service class.

 @return Returns the network service class.
 */
+ (Class)networkServiceClass;

/**
    Sets Branch to use the test `key_test_...` Branch key found in the Info.plist.
    This can only be set before `[Branch getInstance...]` is called.

 @param useTestKey If YES then Branch to use the Branch test found in your app's Info.plist.
*/
+ (void)setUseTestBranchKey:(BOOL)useTestKey;

/// @return Returns true if the Branch test key should be used.
+ (BOOL)useTestBranchKey;

/**
 Directly sets the Branch key to be used.  Branch usually reads the Branch key from your app's
 Info.plist file which is recommended and more convenient.  But the Branch key can also be set
 with this method. See the documentation at
   https://dev.branch.io/getting-started/sdk-integration-guide/guide/ios/#configure-xcode-project
 for information about configuring your app with Branch keys.

 You can only set the Branch key once per app run.

 @param branchKey The Branch key to use.
 @param error NSError will be set if Branch encounters a key error.
*/
+ (void)setBranchKey:(NSString *)branchKey error:(NSError * _Nullable * _Nullable)error;

/**
 Directly sets the Branch key to be used.  Branch usually reads the Branch key from your app's
 Info.plist file which is recommended and more convenient.  But the Branch key can also be set
 with this method. See the documentation at
 https://dev.branch.io/getting-started/sdk-integration-guide/guide/ios/#configure-xcode-project
 for information about configuring your app with Branch keys.
 
 You can only set the Branch key once per app run.  Any errors are logged.
 
 @param branchKey The Branch key to use.
 */
+ (void)setBranchKey:(NSString *)branchKey;


/// @return Returns the current Branch key.
+ (nullable NSString *) branchKey;

+ (BOOL)branchKeyIsSet;

/**
 * By default, the Branch SDK will include the device fingerprint ID as metadata in Crashlytics
 * reports. This can help locate problems by correlating API traffic with a crash. To
 * prevent reporting the device fingerprint ID to Crashlytics, call
 * [Branch setEnableFingerPrintIDInCrashlyticsReports:NO] before
 * [Branch getInstance] or [Branch getTestInstance].
 *
 * This method is thread-safe.
 *
 * @param enabled Set to NO to disable reporting of the device fingerprint ID to Crashlytics.
 */
+ (void)setEnableFingerprintIDInCrashlyticsReports:(BOOL)enabled;

/**
 * Determine whether device fingerprint ID reporting to Crashlytics is enabled.
 *
 * This method is thread-safe.
 *
 * @return YES if device fingerprint ID reporting to Crashlytics is enabled. NO otherwise.
 */
+ (BOOL)enableFingerprintIDInCrashlyticsReports;

/// TODO: Add documentation.
@property (weak, nullable) NSObject<BranchDelegate>* delegate;

#pragma mark - BranchActivityItemProvider methods
#if !TARGET_OS_TV
///-----------------------------------------
/// @name BranchActivityItemProvider methods
///-----------------------------------------

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params;

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 @param feature The feature the generated link will be associated with.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(nullable NSString *)feature;

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 @param feature The feature the generated link will be associated with.
 @param stage The stage used for the generated link, typically used to indicate what part of a funnel the user is in.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(nullable NSString *)feature stage:(nullable NSString *)stage;

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 @param feature The feature the generated link will be associated with.
 @param stage The stage used for the generated link, typically used to indicate what part of a funnel the user is in.
 @param tags An array of tag strings to be associated with the link.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(nullable NSString *)feature stage:(nullable NSString *)stage tags:(nullable NSArray *)tags;

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 @param feature The feature the generated link will be associated with.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @warning This can fail if the alias is already taken.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(nullable NSString *)feature stage:(nullable NSString *)stage tags:(nullable NSArray *)tags alias:(nullable NSString *)alias;

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 @param feature The feature the generated link will be associated with.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param campaign Use this field to organize the links by actual marketing campaign.
 @param alias The alias for a link.
 @warning This can fail if the alias is already taken.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(nullable NSString *)feature stage:(nullable NSString *)stage campaign:(nullable NSString *)campaign tags:(nullable NSArray *)tags alias:(nullable NSString *)alias;

/**
 Create a BranchActivityItemProvider which subclasses the `UIActivityItemProvider` This can be used for simple sharing via a `UIActivityViewController`.

 Internally, this will create a short Branch Url that will be attached to the shared content.

 @param params A dictionary to use while building up the Branch link.
 @param feature The feature the generated link will be associated with.
 @param stage The stage used for the generated link, typically used to indicate what part of a funnel the user is in.
 @param tags An array of tag strings to be associated with the link.
 @param alias The alias for a link.
 @param delegate A delegate allowing you to override any of the parameters provided here based on the user-selected channel
 @warning This can fail if the alias is already taken.
 */
+ (BranchActivityItemProvider *)getBranchActivityItemWithParams:(NSDictionary *)params feature:(nullable NSString *)feature stage:(nullable NSString *)stage tags:(nullable NSArray *)tags alias:(nullable NSString *)alias delegate:(nullable id <BranchActivityItemProviderDelegate>)delegate;

#endif

#pragma mark - Initialization methods

///---------------------
/// @name Initialization
///---------------------

/**
 Just initialize the Branch session with the app launch options.

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @warning This is not the recommended method of initializing Branch. While Branch is able to properly attribute deep linking info with the launch options, you lose the ability to do anything with a callback.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options;

/**
 Just initialize the Branch session with the app launch options, specifying whether to allow it to be treated as a referral.

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param isReferrable Boolean representing whether to allow the session to be marked as referred, overriding the default behavior.
 @warning This is not the recommended method of initializing Branch. While Branch is able to properly attribute deep linking info with the launch options, you lose the ability to do anything with a callback.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options isReferrable:(BOOL)isReferrable;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param callback A callback that is called when the session is opened. This will be called multiple times during the apps life, including any time the app goes through a background / foreground cycle.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options andRegisterDeepLinkHandler:(nullable callbackWithParams)callback;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param callback A callback that is called when the session is opened. This will be called multiple times during the apps life, including any time the app goes through a background / foreground cycle.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options andRegisterDeepLinkHandlerUsingBranchUniversalObject:(nullable callbackWithBranchUniversalObject)callback;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param automaticallyDisplayController Boolean indicating whether we will automatically launch into deep linked controller matched in the init session dictionary.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param isReferrable Boolean representing whether to allow the session to be marked as referred, overriding the default behavior.
 @param callback A callback that is called when the session is opened. This will be called multiple times during the apps life, including any time the app goes through a background / foreground cycle.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options isReferrable:(BOOL)isReferrable andRegisterDeepLinkHandler:(nullable callbackWithParams)callback;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param isReferrable Boolean representing whether to allow the session to be marked as referred, overriding the default behavior.
 @param automaticallyDisplayController Boolean indicating whether we will automatically launch into deep linked controller matched in the init session dictionary.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options isReferrable:(BOOL)isReferrable automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param automaticallyDisplayController Boolean indicating whether we will automatically launch into deep linked controller matched in the init session dictionary.
 @param callback A callback that is called when the session is opened. This will be called multiple times during the apps life, including any time the app goes through a background / foreground cycle.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController deepLinkHandler:(nullable callbackWithParams)callback;

/**
 Initialize the Branch session with the app launch options and handle the completion with a callback

 @param options The launch options provided by the AppDelegate's `didFinishLaunchingWithOptions:` method.
 @param automaticallyDisplayController Boolean indicating whether we will automatically launch into deep linked controller matched in the init session dictionary.
 @param isReferrable Boolean representing whether to allow the session to be marked as referred, overriding the default behavior.
 @param callback A callback that is called when the session is opened. This will be called multiple times during the apps life, including any time the app goes through a background / foreground cycle.
 */
- (void)initSessionWithLaunchOptions:(nullable NSDictionary *)options automaticallyDisplayDeepLinkController:(BOOL)automaticallyDisplayController isReferrable:(BOOL)isReferrable deepLinkHandler:(nullable callbackWithParams)callback;

- (void)initSceneSessionWithLaunchOptions:(NSDictionary *)options isReferrable:(BOOL)isReferrable explicitlyRequestedReferrable:(BOOL)explicitlyRequestedReferrable automaticallyDisplayController:(BOOL)automaticallyDisplayController
                  registerDeepLinkHandler:(void (^)(BNCInitSessionResponse * _Nullable initResponse, NSError * _Nullable error))callback;
/**
 Allow Branch to handle a link opening the app, returning whether it was from a Branch link or not.

 @param url The url that caused the app to be opened.
 */
- (BOOL)handleDeepLink:(nullable NSURL *)url;

- (BOOL)handleDeepLink:(nullable NSURL *)url sceneIdentifier:(nullable NSString *)sceneIdentifier;

/**
 Have Branch end the current deep link session and start a new session with the provided URL.

 @param url     The URL to use to start the new session.
 @return        Returns true if the passed URL can be handled by Branch.
 */

-(BOOL)handleDeepLinkWithNewSession:(nullable NSURL *)url;

/**
 Allow Branch to handle restoration from an NSUserActivity, returning whether or not it was
 from a Branch link.

 @param userActivity The NSUserActivity that caused the app to be opened.
 */

- (BOOL)continueUserActivity:(nullable NSUserActivity *)userActivity;

- (BOOL)continueUserActivity:(nullable NSUserActivity *)userActivity sceneIdentifier:(nullable NSString *)sceneIdentifier;

/**
 Call this method from inside your app delegate's `application:openURL:sourceApplication:annotation:`
 method so that Branch can open the passed URL. This method is for pre-iOS 9 compatibility: If you don't need
 pre-iOS 9 compatibility, override your app delegate's `application:openURL:options:` method instead and use
 the Branch `application:openURL:options:` to open the URL.

 @warning Pre-iOS 9 compatibility only.

 @param application         The application that was passed to your app delegate.
 @param url                 The URL that was passed to your app delegate.
 @param sourceApplication   The sourceApplication that was passed to your app delegate.
 @param annotation          The annotation that was passed to your app delegate.
 @return                    Returns `YES` if Branch handled the passed URL.
 */
- (BOOL)application:(nullable UIApplication *)application
            openURL:(nullable NSURL *)url
  sourceApplication:(nullable NSString *)sourceApplication
         annotation:(nullable id)annotation;

- (BOOL)sceneIdentifier:(nullable NSString *)sceneIdentifier
                openURL:(nullable NSURL *)url
      sourceApplication:(nullable NSString *)sourceApplication
             annotation:(nullable id)annotation;

/**
 Call this method from inside your app delegate's `application:openURL:options:` method so that Branch can
 open the passed URL.

 This is the preferred Branch method to call inside your `application:openURL:options:` method.

 @param application         The application that was passed to your app delegate.
 @param url                 The URL that was passed to your app delegate.
 @param options             The options dictionary that was passed to your app delegate.
 @return                    Returns `YES` if Branch handled the passed URL.
 */
- (BOOL)application:(nullable UIApplication *)application
            openURL:(nullable NSURL *)url
            options:(nullable NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

///--------------------------------
/// @name Push Notification Support
///--------------------------------

#pragma mark - Pre-initialization support

/**
 DO NOT USE unless you are familiar with the SDK's threading model.
 
 When certain actions are required to complete prior to session initialization, this method can be used to pass in a blocking dispatch_block_t.
 The passed in dispatch_block_t will block Branch initialization thread, not the main thread.
 
 @param initBlock         dispatch_block_t object to be executed prior to session initialization
 */
- (void)dispatchToIsolationQueue:(dispatch_block_t)initBlock;

#pragma mark - Push Notification support

/**
 Allow Branch to handle a push notification with a Branch link.

 To make use of this, when creating a push notification, specify the Branch Link as an NSString, for key @"branch".

 NSDictionary userInfo = @{@"branch": @"https://bnc.lt/...", ... };
 */
- (void)handlePushNotification:(nullable NSDictionary *)userInfo;

#pragma mark - Deep Link Controller methods

///---------------------------
/// @name Deep Link Controller
///---------------------------

- (void)registerDeepLinkController:(nullable UIViewController <BranchDeepLinkingController> *)controller forKey:(nullable NSString *)key __attribute__((deprecated(("This API is deprecated. Please use registerDeepLinkController: forKey: withOption:"))));

/**
 Allow Branch to handle a view controller with options to push, present or show.
 Note:
 * If push option is used and the rootviewcontroller of window is not of type UINavigationViewController, than the sharing View controller would be presented automatically
 */
- (void)registerDeepLinkController:(nullable UIViewController <BranchDeepLinkingController> *)controller forKey:(nullable NSString *)key withPresentation:(BNCViewControllerPresentationOption)option;

#pragma mark - Configuration methods

///--------------------
/// @name Configuration
///--------------------

/**
 Enable debug messages to NSLog.
 */
- (void)enableLogging;

/**
 setDebug is deprecated and all functionality has been disabled.
 
 If you wish to enable logging, please invoke enableLogging.

 If you wish to simulate installs, please see add a Test Device (https://help.branch.io/using-branch/docs/adding-test-devices) then reset your test device's data (https://help.branch.io/using-branch/docs/adding-test-devices#section-resetting-your-test-device-data).
 */
- (void)setDebug __attribute__((deprecated(("setDebug is replaced by enableLogging and test devices. https://help.branch.io/using-branch/docs/adding-test-devices"))));

/**
  @brief        Use the `validateSDKIntegration` method as a debugging aid to assure that you've
                integrated the Branch SDK correctly.

  @discussion   Use the SDK integration validator to check that you've added the Branch SDK and
                handle deep links correctly when you first integrate Branch into your app.

  To check your integration, add the line:

  ```
  [[Branch getInstance] validateSDKIntegration];
  ```

  in your `application:didFinishLaunchingWithOptions:` method in your app delegate. Then run your
  app and follow the instructions.

  This is for testing in development only! Make sure you remove or comment out this line of code in
  your release versions.

  @see [SDK Integration Validator](https://docs.branch.io/pages/resources/validation-tools/#overview_1)
  for more information.

  @warning This should not be used in production.
*/
- (void)validateSDKIntegration;

/**
 Specify additional constant parameters to be included in the response

 @param debugParams dictionary of keystrings/valuestrings that will be added to response
 */
-(void)setDeepLinkDebugMode:(nullable NSDictionary *)debugParams;

/**
 Add a scheme to a whitelist of URI schemes that will be tracked by Branch. Default to all schemes.

 @param scheme to add to the whitelist, i.e. @"http", @"https" or @"myapp"
 */
-(void)addWhiteListedScheme:(nullable NSString *)scheme;

/**
 Add an array of schemes to a whitelist of URI schemes that will be tracked by Branch. Default to all schemes.

 @param schemes array to add to the whitelist, i.e. @[@"http", @"https", @"myapp"]
 */
-(void)setWhiteListedSchemes:(nullable NSArray *)schemes;

/**
 @brief     Sets an array of regex patterns that match URLs for Branch to ignore.

 @discusion Set this property to prevent URLs containing sensitive data such as oauth tokens,
            passwords, login credentials, and other URLs from being transmitted to Branch.

            The Branch SDK already ignores login URLs for Facebook, Twitter, Google, and many oauth
            security URLs, so it's usually unnecessary to set this parameter yourself.

            Set this parameter with any additional URLs that should be ignored by Branch.

            These are ICU standard regular expressions.
*/
@property (copy, nullable) NSArray<NSString*>/*_Nullable*/* blackListURLRegex;

/**
 Register your Facebook SDK's FBSDKAppLinkUtility class to be used by Branch for deferred deep linking from their platform

 @param FBSDKAppLinkUtility - call [FBSDKAppLinkUtility class] after importing #import <FBSDKCoreKit/FBSDKCoreKit.h>
 */
- (void)registerFacebookDeepLinkingClass:(id)FBSDKAppLinkUtility;

/**
 Check for Apple Search Ads before initialization.
 
 This will usually add less than 1 second on first time startup.  Up to 3.5 seconds if Apple Search Ads fails to respond.
 */
- (void)delayInitToCheckForSearchAds;

/**
 Increases the amount of time the SDK waits for Apple Search Ads to respond.
 The default wait has a better than 90% success rate, however waiting longer can improve the success rate.

 This will increase the usual delay to about 3 seconds on first time startup.  Up to about 15 seconds if Apple Search Ads fails to respond.
 */
- (void)useLongerWaitForAppleSearchAds;

/**
 Ignores Apple Search Ads test data.
 
 Apple returns test data for all calls made to the Apple Search Ads API on developer and testflight builds.
 */
- (void)ignoreAppleSearchAdsTestData;

/**
 Set time window for SKAdNetwork callouts.  By default, Branch limits calls to SKAdNetwork to within 72 hours after first install.
 
 Note: Branch does not automatically call SKAdNetwork unless configured on the dashboard.
 */
- (void)setSKAdNetworkCalloutMaxTimeSinceInstall:(NSTimeInterval)maxTimeInterval;

/**
 Specify the time to wait in seconds between retries in the case of a Branch server error

 @param retryInterval Number of seconds to wait between retries.
 */
- (void)setRetryInterval:(NSTimeInterval)retryInterval;

/**
 Specify the max number of times to retry in the case of a Branch server error

 @param maxRetries Number of retries to make.
 */
- (void)setMaxRetries:(NSInteger)maxRetries;

/**
 Specify the amount of time before a request should be considered "timed out"

 @param timeout Number of seconds to before a request is considered timed out.
 */
- (void)setNetworkTimeout:(NSTimeInterval)timeout;

/**
 Disable callouts to ad networks for all events for a user; by default Branch sends callouts to ad networks.
 
 By calling this method with YES, Branch will not send any events to the ad networks specified in your Branch account.  If ad networks are not specified in your Branch account, this method will be ignored and events will still be sent.
 */
- (void)disableAdNetworkCallouts:(BOOL)disableCallouts;

/**
 Specify that Branch should NOT use an invisible SFSafariViewController to attempt cookie-based matching upon install.
 If you call this method, we will fall back to using our pool of cookie-IDFA pairs for matching.
 */
- (void)disableCookieBasedMatching __attribute__((deprecated(("Feature removed.  Did not work on iOS 11+"))));

/**
 TL;DR: If you're using a version of the Facebook SDK that prevents application:didFinishLaunchingWithOptions: from
 returning YES/true when a Universal Link is clicked, you should enable this option.

 Long explanation: in application:didFinishLaunchingWithOptions: you should choose one of the following:

 1. Always `return YES;`, and do *not* invoke `[[Branch getInstance] accountForFacebookSDKPreventingAppLaunch];`
 2. Allow the Facebook SDK to determine whether `application:didFinishLaunchingWithOptions:` returns `YES` or `NO`,
    and invoke `[[Branch getInstance] accountForFacebookSDKPreventingAppLaunch];`

 The reason for this second option is that the Facebook SDK will return `NO` if a Universal Link opens the app
 but that UL is not a Facebook UL. Some developers prefer not to modify
 `application:didFinishLaunchingWithOptions:` to always return `YES` and should use this method instead.
 */
- (void)accountForFacebookSDKPreventingAppLaunch __attribute__((deprecated(("Please ensure application:didFinishLaunchingWithOptions: always returns YES/true instead of using this method. It will be removed in a future release."))));

- (void)suppressWarningLogs __attribute__((deprecated(("suppressWarningLogs is deprecated and all functionality has been disabled. If you wish to turn off all logging, please invoke BNCLogSetDisplayLevel(BNCLogLevelNone)."))));

/**
 For use by other Branch SDKs
 
 @param name Plugin name.  For example, Unity or React Native
 @param version Plugin version
 */
- (void)registerPluginName:(NSString *)name version:(NSString *)version;

/**
 Key-value pairs to be included in the metadata on every request.

 @param key String to be included in request metadata
 @param value Object to be included in request metadata
 */
- (void)setRequestMetadataKey:(NSString *)key value:(nullable id)value;

- (void)enableDelayedInit __attribute__((deprecated(("No longer valid with new init process"))));

- (void)disableDelayedInit __attribute__((deprecated(("No longer valid with new init process"))));

- (nullable NSURL *)getUrlForOnboardingWithRedirectUrl:(nullable NSString *)redirectUrl __attribute__((deprecated(("Feature removed.  Did not work on iOS 11+"))));;

- (void)resumeInit __attribute__((deprecated(("Feature removed.  Did not work on iOS 11+"))));

- (void)setInstallRequestDelay:(NSInteger)installRequestDelay __attribute__((deprecated(("No longer valid with new init process"))));

/**
 Disables the Branch SDK from tracking the user. This is useful for GDPR privacy compliance.

 When tracking is disabled, the Branch SDK will clear the Branch defaults of user identifying
 information and prevent Branch from making any Branch network calls that will track the user.

 Note that:

 * Opening Branch deep links with an explicit URL will work.
 * Deferred deep linking will not work.
 * Generating short links will not work and will return long links instead.
 * Sending user tracking events such as `userCompletedAction`, `BranchCommerceEvents`, and
   `BranchEvents` will fail.
 * User rewards and credits will not work.
 * Setting a user identity and logging a user identity out will not work.

 @param disabled    If set to `true` then tracking will be disabled.
 @warning This will prevent most of the Branch SDK functionality.
*/
+ (void) setTrackingDisabled:(BOOL)disabled;

///Returns the current tracking state.
+ (BOOL) trackingDisabled;

#pragma mark - Session Item methods

///--------------------
/// @name Session Items
///--------------------

/**
 Get the BranchUniversalObject from the first time this user was referred (can be empty).
 */
- (nullable BranchUniversalObject *)getFirstReferringBranchUniversalObject;

/**
 Get the BranchLinkProperties from the first time this user was referred (can be empty).
 */
- (nullable BranchLinkProperties *)getFirstReferringBranchLinkProperties;

/**
 Get the parameters used the first time this user was referred (can be empty).
 */
- (nullable NSDictionary *)getFirstReferringParams;

/**
 Get the BranchUniversalObject from the most recent time this user was referred (can be empty).
 */
- (nullable BranchUniversalObject *)getLatestReferringBranchUniversalObject;

/**
 Get the BranchLinkProperties from the most recent time this user was referred (can be empty).
 */
- (nullable BranchLinkProperties *)getLatestReferringBranchLinkProperties;

/**
 Get the parameters used the most recent time this user was referred (can be empty).
 */
- (nullable NSDictionary *)getLatestReferringParams;

/**
 Returns the most recent referral parameters for this user. An empty object can be returned.
 This call blocks the calling thread until the latest results are available.
 @warning This call blocks the calling thread.
 */
- (nullable NSDictionary*) getLatestReferringParamsSynchronous;

/**
 Tells Branch to act as though initSession hadn't been called. Will require another open call (this is done automatically, internally).
 */
- (void)resetUserSession;

/**
 Indicates whether or not this user has a custom identity specified for them. Note that this is *independent of installs*. If you call setIdentity, this device
 will have that identity associated with this user until `logout` is called. This includes persisting through uninstalls, as we track device id.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 */
- (BOOL)isUserIdentified;

/**
 Set the user's identity to an ID used by your system, so that it is identifiable by you elsewhere.

 @param userId The ID Branch should use to identify this user.
 @warning If you use the same ID between users on different sessions / devices, their actions will be merged.
 @warning This request is not removed from the queue upon failure -- it will be retried until it succeeds.
 @warning You should call `logout` before calling `setIdentity:` a second time.
 */
- (void)setIdentity:(nullable NSString *)userId;

/**
 Set the user's identity to an ID used by your system, so that it is identifiable by you elsewhere. Receive a completion callback, notifying you whether it succeeded or failed.

 @param userId The ID Branch should use to identify this user.
 @param callback The callback to be called once the request has completed (success or failure).
 @warning If you use the same ID between users on different sessions / devices, their actions will be merged.
 @warning This request is not removed from the queue upon failure -- it will be retried until it succeeds. The callback will only ever be called once, though.
 @warning You should call `logout` before calling `setIdentity:` a second time.
 */
- (void)setIdentity:(nullable NSString *)userId withCallback:(nullable callbackWithParams)callback;

/**
 Clear all of the current user's session items.

 @warning If the request to logout fails, the items will not be cleared.
 */
- (void)logout;

- (void)logoutWithCallback:(nullable callbackWithStatus)callback;

#pragma mark - Credit methods

///--------------
/// @name Credits
///--------------

/**
 Loads credit totals from the server.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param callback The callback that is called once the request has completed.
 */
- (void)loadRewardsWithCallback:(nullable callbackWithStatus)callback;

/**
 Redeem credits from the default bucket.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param count The number of credits to redeem.
 @warning You must `loadRewardsWithCallback:` before calling `redeemRewards`.
 */
- (void)redeemRewards:(NSInteger)count;

/**
 Redeem credits from the default bucket.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param count The number of credits to redeem.
 @param callback The callback that is called once the request has completed.
 @warning You must `loadRewardsWithCallback:` before calling `redeemRewards`.
 */
- (void)redeemRewards:(NSInteger)count callback:(nullable callbackWithStatus)callback;

/**
 Redeem credits from the specified bucket.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param count The number of credits to redeem.
 @param bucket The bucket to redeem credits from.
 @warning You must `loadRewardsWithCallback:` before calling `redeemRewards`.
 */
- (void)redeemRewards:(NSInteger)count forBucket:(nullable NSString *)bucket;

/**
 Redeem credits from the specified bucket.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param count The number of credits to redeem.
 @param bucket The bucket to redeem credits from.
 @param callback The callback that is called once the request has completed.
 @warning You must `loadRewardsWithCallback:` before calling `redeemRewards`.
 */
- (void)redeemRewards:(NSInteger)count forBucket:(nullable NSString *)bucket callback:(nullable callbackWithStatus)callback;

/**
 Get the local credit balance for the default bucket.

 @warning You must `loadRewardsWithCallback:` before calling `getCredits`. This method does not make a request for the balance.
 */
- (NSInteger)getCredits;

/**
 Get the local credit balance for the specified bucket.

 @param bucket The bucket to get credits balance from.
 @warning You must `loadRewardsWithCallback:` before calling `getCredits`. This method does not make a request for the balance.
 */
- (NSInteger)getCreditsForBucket:(NSString *)bucket;

/**
 Loads the last 100 credit transaction history items for the default bucket.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param callback The callback to call with the list of transactions.
 */
- (void)getCreditHistoryWithCallback:(nullable callbackWithList)callback;

/**
 Loads the last 100 credit transaction history items for the specified bucket.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param bucket The bucket to get transaction history for.
 @param callback The callback to call with the list of transactions.
 */
- (void)getCreditHistoryForBucket:(nullable NSString *)bucket andCallback:(nullable callbackWithList)callback;

/**
 Loads the last n credit transaction history items after the specified transaction ID for the default.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param creditTransactionId The ID of the transaction to start from.
 @param length The number of transactions to pull.
 @param order The direction to order transactions in the callback list. Least recent first means oldest items will be in the front of the response array, most recent means newest items will be front.
 @param callback The callback to call with the list of transactions.
 */
- (void)getCreditHistoryAfter:(nullable NSString *)creditTransactionId number:(NSInteger)length order:(BranchCreditHistoryOrder)order andCallback:(nullable callbackWithList)callback;

/**
 Loads the last n credit transaction history items after the specified transaction ID for the specified bucket.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param bucket The bucket to get transaction history for.
 @param creditTransactionId The ID of the transaction to start from.
 @param length The number of transactions to pull.
 @param order The direction to order transactions in the callback list. Least recent first means oldest items will be in the front of the response array, most recent means newest items will be front.
 @param callback The callback to call with the list of transactions.
 */
- (void)getCreditHistoryForBucket:(nullable NSString *)bucket after:(nullable NSString *)creditTransactionId number:(NSInteger)length order:(BranchCreditHistoryOrder)order andCallback:(nullable callbackWithList)callback;

#pragma mark - Action methods

///--------------
/// @name Actions
///--------------

/**
 Send a user action to the server. Some examples actions could be things like `viewed_personal_welcome`, `purchased_an_item`, etc.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param action The action string.
 */
- (void)userCompletedAction:(nullable NSString *)action;

/**
 Send a user action to the server with additional state items. Some examples actions could be things like `viewed_personal_welcome`, `purchased_an_item`, etc.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param action The action string.
 @param state The additional state items associated with the action.
 */
- (void)userCompletedAction:(nullable NSString *)action withState:(nullable NSDictionary *)state;

/**
 Send a user action to the server with additional state items. Some examples actions could be things like `viewed_personal_welcome`, `purchased_an_item`, etc.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param action The action string.
 @param state The additional state items associated with the action.
 @param branchViewCallback Callback for Branch view state.
 
 @deprecated Please use userCompletedAction:action:state instead
 */
- (void)userCompletedAction:(nullable NSString *)action withState:(nullable NSDictionary *)state withDelegate:(nullable id)branchViewCallback __attribute__((deprecated(("This API is deprecated. Please use userCompletedAction:action:state instead."))));

/**
 Sends a user commerce event to the server.

 Use commerce events to track when a user purchases an item in your online store,
 makes an in-app purchase, or buys a subscription.  The commerce events are tracked in
 the Branch dashboard along with your other events so you can judge the effectiveness of
 campaigns and other analytics.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param commerceEvent 	The BNCCommerceEvent that describes the purchase.
 @param metadata        Optional metadata you may want add to the event.
 @param completion 		The optional completion callback.
 
 @deprecated Please use BNCEvent to track commerce events instead.
 */
- (void) sendCommerceEvent:(BNCCommerceEvent*)commerceEvent
				  metadata:(NSDictionary<NSString*,id>*)metadata
			withCompletion:(void (^) (NSDictionary* _Nullable response, NSError* _Nullable error))completion __attribute__((deprecated(("Please use BranchEvent to track commerce events."))));


#pragma mark - Query methods

/**
 Branch includes SDK methods to allow retrieval of our Cross Platform ID (CPID) from the client. This results in an asynchronous call being made to Branch’s servers with CPID data returned when possible.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param completion callback with cross platform id data
 */
- (void)crossPlatformIdDataWithCompletion:(void(^) (BranchCrossPlatformID * _Nullable cpid))completion;

/**
 Branch includes SDK methods to allow retrieval of our last attributed touch data (LATD) from the client. This results in an asynchronous call being made to Branch's servers with LATD data returned when possible.
 Last attributed touch data contains the information associated with that user's last viewed impression or clicked link.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param window attribution window in days.  If the window is 0, the server will use the server side default.  If the window is outside the server supported range, it will default to 30 days.
 @param completion callback with attribution data
 */
- (void)lastAttributedTouchDataWithAttributionWindow:(NSInteger)window completion:(void(^) (BranchLastAttributedTouchData * _Nullable latd))completion;

#pragma mark - Short Url Sync methods

///---------------------------------------
/// @name Synchronous Short Url Generation
///---------------------------------------

/**
 Get a short url without any items specified. The usage type will default to unlimited.
 */
- (NSString *)getShortURL;

/**
 Get a short url with specified params. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params;

/**
 Get a short url with specified params, channel, and feature. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature;

/**
 Get a short url with specified params, channel, feature, and stage. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage;

/**
 Get a short url with specified params, channel, feature, stage, and alias. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @warning This method makes a synchronous url request.
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias;

/**
 Get a short url with specified params, channel, feature, stage, and type.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param type The type of link this is, one of Single Use or Unlimited Use. Single use means once *per user*, not once period.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andType:(BranchLinkType)type;

/**
 Get a short url with specified params, channel, feature, stage, and match duration. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andMatchDuration:(NSUInteger)duration;

/**
 Get a short url with specified tags, params, channel, feature, and stage. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage;

/**
 Get a short url with specified tags, params, channel, feature, stage, and alias. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @warning This method makes a synchronous url request.
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias;

/**
 Get a short url with specified tags, params, channel, feature, and stage. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @param ignoreUAString The User Agent string to tell the server to ignore the next request from, to prevent it from treating a preview scrape as a link click.
 @warning This method makes a synchronous url request.
 @warning This method is primarily intended to be an internal Branch method, used to work around a bug with SLComposeViewController
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias ignoreUAString:(nullable NSString *)ignoreUAString;

/**
 Get a short url with specified tags, params, channel, feature, stage and campaign. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param campaign Use this field to organize the links by actual marketing campaign.
 @param alias The alias for a link.
 @param ignoreUAString The User Agent string to tell the server to ignore the next request from, to prevent it from treating a preview scrape as a link click.
 @param forceLinkCreation Whether we should create a link from the Branch Key even if initSession failed. Defaults to NO.
 @warning This method makes a synchronous url request.
 @warning This method is primarily intended to be an internal Branch method, used to work around a bug with SLComposeViewController
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andCampaign:(nullable NSString *)campaign andAlias:(nullable NSString *)alias ignoreUAString:(nullable NSString *)ignoreUAString forceLinkCreation:(BOOL)forceLinkCreation;

/**
 Get a short url with specified tags, params, channel, feature, stage, and type.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param type The type of link this is, one of Single Use or Unlimited Use. Single use means once *per user*, not once period.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andType:(BranchLinkType)type;

/**
 Get a short url with specified tags, params, channel, feature, stage, and match duration. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andMatchDuration:(NSUInteger)duration;

/**
 Get a short url with specified tags, params, channel, feature, stage, and match duration. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param alias The alias for a link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @warning This method makes a synchronous url request.
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getShortUrlWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andAlias:(nullable NSString *)alias andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andMatchDuration:(NSUInteger)duration;


/**
 Get a short url with specified params, channel, feature, stage, campaign and match duration. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param alias The alias for a link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param campaign Use this field to organize the links by actual marketing campaign.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @warning This method makes a synchronous url request.
 */
- (NSString *)getShortUrlWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andAlias:(nullable NSString *)alias andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andCampaign:campaign andMatchDuration:(NSUInteger)duration;

#pragma mark - Long Url generation

///--------------------------
/// @name Long Url generation
///--------------------------

/**
 Construct a long url with specified params. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 */
- (NSString *)getLongURLWithParams:(nullable NSDictionary *)params;

/**
 Get a long url with specified params and feature. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 */
- (NSString *)getLongURLWithParams:(nullable NSDictionary *)params andFeature:(nullable NSString *)feature;

/**
 Get a long url with specified params, feature, and stage. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 */
- (NSString *)getLongURLWithParams:(nullable NSDictionary *)params andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage;

/**
 Get a long url with specified params, feature, stage, and tags. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param tags An array of tags to associate with this link, useful for tracking.
 */
- (NSString *)getLongURLWithParams:(nullable NSDictionary *)params andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andTags:(nullable NSArray *)tags;

/**
 Get a long url with specified params, feature, stage, and alias. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getLongURLWithParams:(nullable NSDictionary *)params andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias;

/**
 Get a long url with specified params, channel, tags, feature, stage, and alias. The usage type will default to unlimited.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @warning This can fail if the alias is already taken.
 */
- (NSString *)getLongURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andTags:(nullable NSArray *)tags andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias;

#pragma mark - Short Url Async methods

///----------------------------------------
/// @name Asynchronous Short Url Generation
///----------------------------------------

/**
 Get a short url without any items specified. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param callback Callback called with the url.
 */
- (void)getShortURLWithCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, channel, and feature. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, channel, feature, and stage. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, channel, feature, stage, and alias. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @param callback Callback called with the url.
 @warning This can fail if the alias is already taken.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, channel, feature, stage, and link type.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param type The type of link this is, one of Single Use or Unlimited Use. Single use means once *per user*, not once period.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andType:(BranchLinkType)type andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, channel, feature, stage, and match duration. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andMatchDuration:(NSUInteger)duration andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, tags, channel, feature, and stage. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, tags, channel, feature, stage, and alias. The usage type will default to unlimited.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param alias The alias for a link.
 @param callback Callback called with the url.
 @warning This can fail if the alias is already taken.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andAlias:(nullable NSString *)alias andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, tags, channel, feature, stage, and link type.
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param type The type of link this is, one of Single Use or Unlimited Use. Single use means once *per user*, not once period.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andType:(BranchLinkType)type andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, tags, channel, feature, stage, and match duration. The usage type will default to unlimited.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @param callback Callback called with the url.
 */
- (void)getShortURLWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andMatchDuration:(NSUInteger)duration andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, tags, channel, feature, stage, and match duration. The usage type will default to unlimited.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @param callback Callback called with the url.
 @param alias The alias for a link.
 @warning This can fail if the alias is already taken.
 */
- (void)getShortUrlWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andAlias:(nullable NSString *)alias andMatchDuration:(NSUInteger)duration andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andCallback:(nullable callbackWithUrl)callback;

/**
 Get a short url with the specified params, tags, channel, feature, stage, campaign and match duration. The usage type will default to unlimited.

 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.
 
 @param params Dictionary of parameters to include in the link.
 @param channel The channel for the link. Examples could be Facebook, Twitter, SMS, etc, depending on where it will be shared.
 @param tags An array of tags to associate with this link, useful for tracking.
 @param feature The feature this is utilizing. Examples could be Sharing, Referring, Inviting, etc.
 @param stage The stage used for the generated link, indicating what part of a funnel the user is in.
 @param duration How long to keep an unmatched link click in the Branch backend server's queue before discarding.
 @param campaign Use this field to organize the links by actual marketing campaign.
 @param callback Callback called with the url.
 @param alias The alias for a link.
 @warning This can fail if the alias is already taken.
 */
- (void)getShortUrlWithParams:(nullable NSDictionary *)params andTags:(nullable NSArray *)tags andAlias:(nullable NSString *)alias andMatchDuration:(NSUInteger)duration andChannel:(nullable NSString *)channel andFeature:(nullable NSString *)feature andStage:(nullable NSString *)stage andCampaign:(nullable NSString *)campaign andCallback:(nullable callbackWithUrl)callback;

/**
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 */
- (void)getSpotlightUrlWithParams:(NSDictionary *)params callback:(callbackWithParams)callback;

#pragma mark - Content Discovery methods
#if !TARGET_OS_TV

///--------------------------------
/// @name Content Discovery methods
///--------------------------------

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. It will not be public by default. Type defaults to kUTTypeImage.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. It will not be public by default. Type defaults to kUTTypeImage.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description callback:(callbackWithUrl)callback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. Type defaults to kUTTypeImage.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable callback:(callbackWithUrl)callback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param keywords A set of keywords to be used in Apple's search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords callback:(callbackWithUrl)callback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param keywords A set of keywords to be used in Apple's search index.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param keywords A set of keywords to be used in Apple's search index.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param keywords A set of keywords to be used in Apple's search index.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param linkParams A set of keywords to be used in Apple's search index.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams publiclyIndexable:(BOOL)publiclyIndexable;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param keywords A set of keywords to be used in Apple's search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */

- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords callback:(callbackWithUrl)callback;
/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param keywords A set of keywords to be used in Apple's search index.
 @param expirationDate ExpirationDate after which this will not appear in Apple's search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate callback:(callbackWithUrl)callback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.

 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param canonicalId The canonical identifier for the content for deduplication
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param keywords A set of keywords to be used in Apple's search index.
 @param expirationDate ExpirationDate after which this will not appear in Apple's search index.
 @param callback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl canonicalId:(NSString *)canonicalId linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate callback:(callbackWithUrl)callback;


/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.
 
 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param keywords A set of keywords to be used in Apple's search index.
 @param expirationDate ExpirationDate after which this will not appear in Apple's search index.
 @param spotlightCallback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback;

/**
 Take the current screen and make it discoverable, adding it to Apple's Core Spotlight index. Will be public if specified. You can override the type as desired, using one of the types provided in MobileCoreServices.
 
 @param title Title for the spotlight preview item.
 @param description Description for the spotlight preview item.
 @param thumbnailUrl Url to an image to be used for the thumnbail in spotlight.
 @param canonicalId The canonical identifier for the content for deduplication
 @param linkParams Additional params to be added to the NSUserActivity. These will also be added to the Branch link.
 @param publiclyIndexable Whether or not this item should be added to Apple's public search index.
 @param type The type to use for the NSUserActivity, taken from the list of constants provided in the MobileCoreServices framework.
 @param keywords A set of keywords to be used in Apple's search index.
 @param expirationDate ExpirationDate after which this will not appear in Apple's search index.
 @param spotlightCallback Callback called with the Branch url this will fallback to.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)createDiscoverableContentWithTitle:(NSString *)title description:(NSString *)description thumbnailUrl:(NSURL *)thumbnailUrl canonicalId:(NSString *)canonicalId linkParams:(NSDictionary *)linkParams type:(NSString *)type publiclyIndexable:(BOOL)publiclyIndexable keywords:(NSSet *)keywords expirationDate:(NSDate *)expirationDate spotlightCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback;

/**
 Index Branch Univeral Objects using SearchableItem of Apple's CoreSpotlight, where content indexed is private irrespective of Buo's ContentIndexMode value.
 @param universalObject Branch Universal Object is indexed on spotlight using meta data of spotlight
 @param linkProperties  Branch Link Properties is used in short url generation
 @param completion Callback called when all Branch Universal Objects are indexed. Dynamic url generated and saved as spotlight identifier
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)indexOnSpotlightWithBranchUniversalObject:(BranchUniversalObject *)universalObject
                                   linkProperties:(nullable BranchLinkProperties *)linkProperties
                                       completion:(void (^) (BranchUniversalObject *universalObject, NSString * url,NSError *error))completion;

/**
 Index multiple Branch Univeral Objects using SearchableItem of Apple's CoreSpotlight, where content indexed is private irrespective of Buo's ContentIndexMode value.
 @param universalObjects Multiple Branch Universal Objects are indexed on spotlight using meta data of spotlight
 @param completion Callback called when all Branch Universal Objects are indexed. Dynamic URL generated is returned as spotlightIdentifier of Branch Universal Object. Use this identifier to remove content from spotlight.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)indexOnSpotlightUsingSearchableItems:(NSArray<BranchUniversalObject*>*)universalObjects
                                  completion:(void (^) (NSArray<BranchUniversalObject*>* universalObjects,
                                                        NSError* error))completion;

/*
 Remove Indexing of a Branch Universal Objects, which is indexed using SearchableItem of Apple's CoreSpotlight.
 @param universalObject Branch Universal Object which is already indexed using SearchableItem is removed from spotlight
 @param completion Called when the request has been journaled by the index (“journaled” means that the index makes a note that it has to perform this operation). Note that the request may not have completed.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)removeSearchableItemWithBranchUniversalObject:(BranchUniversalObject *)universalObject
                                             callback:(void (^_Nullable)(NSError * _Nullable error))completion;
/*
 Remove Indexing of an array of Branch Universal Objects, which are indexed using SearchableItem of Apple's CoreSpotlight.
 @param universalObjects Multiple Branch Universal Objects which are already indexed using SearchableItem are removed from spotlight. Note: The spotlight identifier of Branch Universal Object is used to remove indexing.
 @param completion Called when the request has been journaled by the index (“journaled” means that the index makes a note that it has to perform this operation). Note that the request may not have completed.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)removeSearchableItemsWithBranchUniversalObjects:(NSArray<BranchUniversalObject*> *)universalObjects
                                               callback:(void (^_Nullable)(NSError * _Nullable error))completion;

/*
 Remove all content spotlight indexed through either Searchable Item or privately indexed Branch Universal Object.
 @param completion Called when the request has been journaled by the index (“journaled” means that the index makes a note that it has to perform this operation). Note that the request may not have completed.
 @warning These functions are only usable on iOS 9 or above. Earlier versions will simply receive the callback with an error.
 */
- (void)removeAllPrivateContentFromSpotLightWithCallback:(void (^_Nullable)(NSError * _Nullable error))completion;

#endif

/**
 Method for creating a one of Branch instance and specifying its dependencies.

 @warning This is meant for use internally only (exposed for the sake of testing) and should not be used by apps.
 */
- (id)initWithInterface:(BNCServerInterface *)interface queue:(BNCServerRequestQueue *)queue cache:(BNCLinkCache *)cache preferenceHelper:(BNCPreferenceHelper *)preferenceHelper key:(NSString *)key;

/**
 Method used by BranchUniversalObject to register a view on content
 
 This method should only be invoked after initSession.
 If it is invoked before, then we will silently initialize the SDK before the callback has been set, in order to carry out this method's required task.
 As a result, you may experience issues where the initSession callback does not fire. Again, the solution to this issue is to only invoke this method after you have invoked initSession.

 @warning This is meant for use internally only and should not be used by apps.
 */
- (void)registerViewWithParams:(NSDictionary *)params andCallback:(callbackWithParams)callback
    __attribute__((deprecated(("This API is deprecated. Please use BranchEvent:BranchStandardEventViewItem instead."))));

- (void) sendServerRequest:(BNCServerRequest*)request;
- (void) sendServerRequestWithoutSession:(BNCServerRequest*)request __attribute__((deprecated(("This API is deprecated. Please use sendServerRequest instead."))));

/**
 This is the block that is called each time a new Branch session is started. It is automatically set
 when Branch is initialized with `initSessionWithLaunchOptions:andRegisterDeepLinkHandler`.
 */
@property (copy, nonatomic) void(^ sessionInitWithParamsCallback) (NSDictionary * _Nullable params, NSError * _Nullable error) DEPRECATED_ATTRIBUTE;

/**
 This is the block that is called each time a new Branch session is started. It is automatically set
 when Branch is initialized with `initSessionWithLaunchOptions:andRegisterDeepLinkHandlerUsingBranchUniversalObject`.

 The difference with this callback from `sessionInitWithParamsCallback` is that it is called with a
 BranchUniversalObject.
 */
@property (copy, nonatomic) void (^ sessionInitWithBranchUniversalObjectCallback) (BranchUniversalObject * _Nullable universalObject, BranchLinkProperties * _Nullable linkProperties, NSError * _Nullable error) DEPRECATED_ATTRIBUTE;

// Read-only property exposed for unit testing.
@property (strong, readonly) BNCServerInterface* serverInterface;
- (void) clearNetworkQueue;
@end

NS_ASSUME_NONNULL_END
