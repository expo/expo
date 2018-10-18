// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXBuildConstants.h"
#import "EXAppDelegate.h"

#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>

#import "ExpoKit.h"
#import "EXRootViewController.h"
#import "EXConstants.h"


#if __has_include(<EXFirebaseNotifications/EXFirebaseNotifications.h>)
#import <EXFirebaseNotifications/EXFirebaseNotifications.h>
#endif

#if __has_include(<EXFirebaseMessaging/EXFirebaseMessaging.h>)
#import <EXFirebaseMessaging/EXFirebaseMessaging.h>
#endif
#if __has_include(<EXFirebaseLinks/EXFirebaseLinks.h>)
#if __has_include(<EXFirebaseInvites/EXFirebaseInvites.h>)
#import <EXFirebaseInvites/EXFirebaseInvites.h>
#else
#import <EXFirebaseLinks/EXFirebaseLinks.h>
#endif
#endif

#if __has_include(<FirebaseCore/FIRApp.h>)
#import <FirebaseCore/FIROptions.h>
#import <FirebaseCore/FIRApp.h>
#endif

#if __has_include(<FirebaseDatabase/FIRDatabase.h>)
#import <FirebaseDatabase/FIRDatabase.h>
#endif


NS_ASSUME_NONNULL_BEGIN

static NSString *const EXLinkingUrlScheme = @"https://expodemo.page.link";

@interface ExpoKit (Crashlytics) <CrashlyticsDelegate>

@end

@implementation EXAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  
#if __has_include(<FirebaseCore/FIRApp.h>)
  // If the app contains the GoogleService-Info.plist then use it.
  if ([FIROptions defaultOptions] != nil) {
#if __has_include(<EXFirebaseLinks/EXFirebaseLinks.h>)
    if (![EXLinkingUrlScheme isEqualToString:@""]) [FIROptions defaultOptions].deepLinkURLScheme = EXLinkingUrlScheme;
#endif
    [FIRApp configure];
#if __has_include(<EXFirebaseDatabase/EXFirebaseDatabase.h>)
    [FIRDatabase database].persistenceEnabled = YES;
#endif
#if __has_include(<EXFirebaseNotifications/EXFirebaseNotifications.h>)
    [EXFirebaseNotifications configure];
#endif
  }
#endif

  
  CrashlyticsKit.delegate = [ExpoKit sharedInstance]; // this must be set prior to init'ing fabric.
  [Fabric with:@[CrashlyticsKit]];
  [CrashlyticsKit setObjectValue:[EXBuildConstants sharedInstance].expoRuntimeVersion forKey:@"exp_client_version"];

  [[ExpoKit sharedInstance] registerRootViewControllerClass:[EXRootViewController class]];
  [[ExpoKit sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];
  
  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = (EXRootViewController *)[ExpoKit sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_window makeKeyAndVisible];

  return YES;
}

#pragma mark - Handling URLs


- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
#if __has_include(<EXFirebaseLinks/EXFirebaseLinks.h>)
#if __has_include(<EXFirebaseInvites/EXFirebaseInvites.h>)
  if ([[EXFirebaseInvites instance] application:app openURL:url options:options]) return YES;
#else
  if ([[EXFirebaseLinks instance] application:app openURL:url options:options]) return YES;
#endif
#endif
  return NO;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  return [[ExpoKit sharedInstance] application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray * _Nullable))restorationHandler
{
#if __has_include(<EXFirebaseLinks/EXFirebaseLinks.h>)
#if __has_include(<EXFirebaseInvites/EXFirebaseInvites.h>)
  if ([[EXFirebaseInvites instance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler]) return YES;
#else
  if ([[EXFirebaseLinks instance] application:application continueUserActivity:userActivity restorationHandler:restorationHandler]) return YES;
#endif
#endif
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

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo
fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
#if __has_include(<EXFirebaseNotifications/EXFirebaseNotifications.h>)
  [[EXFirebaseNotifications instance] didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
#endif
  [[ExpoKit sharedInstance] application:application didReceiveRemoteNotification:userInfo];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(nonnull UILocalNotification *)notification
{
#if __has_include(<EXFirebaseNotifications/EXFirebaseNotifications.h>)
  [[EXFirebaseNotifications instance] didReceiveLocalNotification:notification];
#endif
  [[ExpoKit sharedInstance] application:application didReceiveLocalNotification:notification];
}

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings
{
  [[ExpoKit sharedInstance] application:application didRegisterUserNotificationSettings:notificationSettings];
}

@end

NS_ASSUME_NONNULL_END
