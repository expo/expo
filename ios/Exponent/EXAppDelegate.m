// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXBuildConstants.h"
#import "EXAppDelegate.h"

#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>

#import "ExpoKit.h"
#import "EXKeys.h"
#import "EXRootViewController.h"
#import "EXConstants.h"

NS_ASSUME_NONNULL_BEGIN

@interface ExpoKit (Crashlytics) <CrashlyticsDelegate>

@end

@implementation EXAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  CrashlyticsKit.delegate = [ExpoKit sharedInstance]; // this must be set prior to init'ing fabric.
  [Fabric with:@[CrashlyticsKit]];
  [CrashlyticsKit setObjectValue:[EXBuildConstants sharedInstance].expoRuntimeVersion forKey:@"exp_client_version"];

  [[ExpoKit sharedInstance] registerRootViewControllerClass:[EXRootViewController class]];
  [[ExpoKit sharedInstance] setApplicationKeys:self._applicationKeys];
  [[ExpoKit sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = (EXRootViewController *)[ExpoKit sharedInstance].rootViewController;
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
  return [[ExpoKit sharedInstance] application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
  return [[ExpoKit sharedInstance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

#pragma mark - Notifications

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)token
{
  [[ExpoKit sharedInstance] application:application didRegisterForRemoteNotificationsWithDeviceToken:token];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
  [[ExpoKit sharedInstance] application:application didFailToRegisterForRemoteNotificationsWithError:err];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[ExpoKit sharedInstance] application:application didReceiveRemoteNotification:notification];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(nonnull UILocalNotification *)notification
{
  [[ExpoKit sharedInstance] application:application didReceiveLocalNotification:notification];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings
{
  if (notificationSettings.types == UIUserNotificationTypeNone) {
    // happens when user hits "don't allow" on notifications permission dialogue.
    NSError *err = [NSError errorWithDomain:@"EXNotifications" code:-1 userInfo:@{ NSLocalizedDescriptionKey: @"User denied notification permissions" }];
    [[ExpoKit sharedInstance] application:application didFailToRegisterForRemoteNotificationsWithError:err];
  } else {
    // we'll get notified of success by some other method, e.g. `didRegisterForRemoteNotifications`
  }
}

#pragma mark - internal

- (NSDictionary *)_applicationKeys
{
  NSMutableDictionary *result = [NSMutableDictionary dictionary];
#ifdef AMPLITUDE_KEY
  result[@"AMPLITUDE_KEY"] = AMPLITUDE_KEY;
#endif
#ifdef AMPLITUDE_DEV_KEY
  result[@"AMPLITUDE_DEV_KEY"] = AMPLITUDE_DEV_KEY;
#endif
#ifdef GOOGLE_MAPS_IOS_API_KEY
  result[@"GOOGLE_MAPS_IOS_API_KEY"] = GOOGLE_MAPS_IOS_API_KEY;
#endif
  return result;
}

@end

NS_ASSUME_NONNULL_END
