// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXAppDidRegisterForRemoteNotificationsNotification;

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
 *  Keys to third-party integrations used inside ExpoKit.
 *  TODO: document this.
 */
@property (nonatomic, strong) NSDictionary *applicationKeys;

#pragma mark - remote JS loading hooks

/**
 *  If specified, use this url instead of the one configured in `EXShell.plist`.
 *  Must be set prior to loading the RN application.
 */
@property (nonatomic, strong, nullable) NSString *publishedManifestUrlOverride;

#pragma mark - misc AppDelegate hooks

- (void)setLaunchOptions:(NSDictionary * _Nullable)launchOptions;
- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

#pragma mark - APNS hooks

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification;
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification;
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err;

#pragma mark - deep linking hooks

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation;
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler;

@end

NS_ASSUME_NONNULL_END
