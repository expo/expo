// Copyright 2015-present 650 Industries. All rights reserved.

@import ObjectiveC;

#import "EXBuildConstants.h"
#import "EXAppDelegate.h"

#import <Crashlytics/Crashlytics.h>
#import <Fabric/Fabric.h>
#import <EXTaskManager/EXTaskService.h>
#import <UMCore/UMModuleRegistryProvider.h>

#import "ExpoKit.h"
#import "EXRootViewController.h"
#import "EXConstants.h"

#if __has_include(<EXAppAuth/EXAppAuth.h>)
#import <EXAppAuth/EXAppAuth.h>
#endif

#if __has_include(<ABI32_0_0EXAppAuth/ABI32_0_0EXAppAuth.h>)
#import <ABI32_0_0EXAppAuth/ABI32_0_0EXAppAuth.h>
#endif

#if __has_include(<GoogleSignIn/GoogleSignIn.h>)
#import <GoogleSignIn/GoogleSignIn.h>
#endif

#if __has_include(<ABI32_0_0GoogleSignIn/ABI32_0_0GoogleSignIn.h>)
#import <GoogleSignIn/GoogleSignIn.h>
#endif

#if __has_include(<EXFacebook/EXFacebook.h>)
#import <EXFacebook/EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface ExpoKit (Crashlytics) <CrashlyticsDelegate>

@end

@implementation EXAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  CrashlyticsKit.delegate = [ExpoKit sharedInstance]; // this must be set prior to init'ing fabric.
  [Fabric with:@[CrashlyticsKit]];
  [CrashlyticsKit setObjectValue:[EXBuildConstants sharedInstance].expoRuntimeVersion forKey:@"exp_client_version"];

#if __has_include(<EXFacebook/EXFacebook.h>)
  if ([EXFacebook facebookAppIdFromNSBundle]) {
    [[FBSDKApplicationDelegate sharedInstance] application:application
                             didFinishLaunchingWithOptions:launchOptions];
  }
#endif

  if ([application applicationState] != UIApplicationStateBackground) {
    // App launched in foreground
    [self _setUpUserInterfaceForApplication:application withLaunchOptions:launchOptions];
  }
  [(EXTaskService *)[UMModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  return YES;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
  [self _setUpUserInterfaceForApplication:application withLaunchOptions:nil];
}

- (void)_setUpUserInterfaceForApplication:(UIApplication *)application withLaunchOptions:(nullable NSDictionary *)launchOptions
{
  if (_window) {
    return;
  }
  [[ExpoKit sharedInstance] registerRootViewControllerClass:[EXRootViewController class]];
  [[ExpoKit sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = (EXRootViewController *)[ExpoKit sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_window makeKeyAndVisible];
}

#pragma mark - Background Fetch

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(EXTaskService *)[UMModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

#pragma mark - Handling URLs

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  id annotation = options[UIApplicationOpenURLOptionsAnnotationKey];
  NSString *sourceApplication = options[UIApplicationOpenURLOptionsSourceApplicationKey];
#if __has_include(<GoogleSignIn/GoogleSignIn.h>)
  if ([[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation]) {
    return YES;
  }
#endif
#if __has_include(<ABI32_0_0GoogleSignIn/ABI32_0_0GoogleSignIn.h>)
  if ([[ABI32_0_0GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation]) {
    return YES;
  }
#endif
#if __has_include(<EXAppAuth/EXAppAuth.h>)
  if ([[EXAppAuth instance] application:app openURL:url options:options]) {
    return YES;
  }
#endif
#if __has_include(<ABI32_0_0EXAppAuth/ABI32_0_0EXAppAuth.h>)
  if ([[ABI32_0_0EXAppAuth instance] application:app openURL:url options:options]) {
    return YES;
  }
#endif
#if __has_include(<EXFacebook/EXFacebook.h>)
  if ([EXFacebook facebookAppIdFromNSBundle]) {
    if ([[FBSDKApplicationDelegate sharedInstance] application:app
                                                       openURL:url
                                                       options:options]) {
      return YES;
    }
  }
#endif
  return [[ExpoKit sharedInstance] application:app openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
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

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [[ExpoKit sharedInstance] application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
  [(EXTaskService *)[UMModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

// TODO: Remove once SDK31 is phased out
- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(nonnull UIUserNotificationSettings *)notificationSettings
{
  [[ExpoKit sharedInstance] application:application didRegisterUserNotificationSettings:notificationSettings];
}

@end

NS_ASSUME_NONNULL_END
