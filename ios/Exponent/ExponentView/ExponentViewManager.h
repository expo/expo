// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXAppDidRegisterForRemoteNotificationsNotification;

@class EXViewController;

@interface ExponentViewManager : NSObject

+ (instancetype)sharedInstance;

/**
 *  Register an EXViewController subclass as the root class.
 *  This must be the first method called on ExponentViewManager's singleton instance to make any difference.
 */
- (void)registerRootViewControllerClass:(Class)rootViewControllerClass;

/**
 *  The root Exponent view controller hosting a detached Exponent app.
 */
- (EXViewController *)rootViewController;

#pragma mark - misc AppDelegate hooks

- (void)setLaunchOptions:(NSDictionary * _Nullable)launchOptions;
- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

#pragma mark - APNS hooks

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification;
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token;
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err;

@end

NS_ASSUME_NONNULL_END
