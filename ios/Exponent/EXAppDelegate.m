// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXAppDelegate.h"

#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>

#import "ExponentViewManager.h"
#import "EXRootViewController.h"
#import "EXConstants.h"

NS_ASSUME_NONNULL_BEGIN

@implementation EXAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [Fabric with:@[CrashlyticsKit]];
  [CrashlyticsKit setObjectValue:[EXConstants getExponentClientVersion] forKey:@"exp_client_version"];

  [[ExponentViewManager sharedInstance] registerRootViewControllerClass:[EXRootViewController class]];
  [[ExponentViewManager sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = (EXRootViewController *)[ExponentViewManager sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_rootViewController loadReactApplication];
  [_window makeKeyAndVisible];

  return YES;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [_rootViewController applicationWillEnterForeground];
}

#pragma mark - Handling URLs

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  return [[ExponentViewManager sharedInstance] application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  return [[ExponentViewManager sharedInstance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  [[ExponentViewManager sharedInstance] application:application didRegisterForRemoteNotificationsWithDeviceToken:token];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  [[ExponentViewManager sharedInstance] application:application didFailToRegisterForRemoteNotificationsWithError:err];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[ExponentViewManager sharedInstance] application:application didReceiveRemoteNotification:notification];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(nonnull UILocalNotification *)notification
{
  [[ExponentViewManager sharedInstance] application:application didReceiveLocalNotification:notification];
}

@end

NS_ASSUME_NONNULL_END
