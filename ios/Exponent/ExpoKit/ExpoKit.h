// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXAppDidRegisterForRemoteNotificationsNotification;
FOUNDATION_EXPORT NSString * const EXAppDidRegisterUserNotificationSettingsNotification;

@class EXViewController;

@interface ExpoKit : NSObject

+ (instancetype)sharedInstance;

/**
 *  Register an EXViewController subclass as the root class.
 *  This must be the first method called on ExpoKit's singleton instance to make any difference.
 */
- (void)registerRootViewControllerClass:(Class)rootViewControllerClass;

/**
 *  The root Exponent view controller hosting a detached Exponent app.
 */
- (EXViewController *)rootViewController;

/**
 *  The current view controller that is presented by Exponent app.
 */
- (UIViewController *)currentViewController;

/**
 *  Keys to third-party integrations used inside ExpoKit.
 *  TODO: document this.
 */
@property (nonatomic, strong) NSDictionary *applicationKeys;

@property (nonatomic, readonly) NSDictionary *launchOptions;

@property (nonatomic, weak) Class moduleRegistryDelegateClass;

#pragma mark - remote JS loading hooks

/**
 *  If specified, use this url instead of the one configured in `EXShell.plist`.
 *  Must be set prior to loading the RN application.
 */
@property (nonatomic, strong, nullable) NSString *publishedManifestUrlOverride;

#pragma mark - misc AppDelegate hooks

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

#pragma mark - APNS hooks
// TODO: Remove once SDK31 is phased out
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings;
#pragma clang diagnostic pop

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err;
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler;

#pragma mark - deep linking hooks
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation;
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler;

@end

NS_ASSUME_NONNULL_END
