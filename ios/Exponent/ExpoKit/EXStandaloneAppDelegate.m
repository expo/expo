// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXViewController.h"
#import "EXStandaloneAppDelegate.h"

#import <EXCore/EXModuleRegistryProvider.h>

#if __has_include(<EXAppAuth/EXAppAuth.h>)
#import <EXAppAuth/EXAppAuth.h>
#endif

#if __has_include(<GoogleSignIn/GoogleSignIn.h>)
#import <GoogleSignIn/GoogleSignIn.h>
#endif

#if __has_include(<EXTaskManager/EXTaskService.h>)
#import <EXTaskManager/EXTaskService.h>
#endif

@interface EXStandaloneAppDelegate ()

@property (nonatomic, strong) EXViewController *rootViewController;

@end

@implementation EXStandaloneAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if ([application applicationState] != UIApplicationStateBackground) {
    // App launched in foreground
    [self _setUpUserInterfaceForApplication:application withLaunchOptions:launchOptions];
  }
#if __has_include(<EXTaskManager/EXTaskService.h>)
  [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
#endif
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
  [[ExpoKit sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

  _window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  _window.backgroundColor = [UIColor whiteColor];
  _rootViewController = [ExpoKit sharedInstance].rootViewController;
  _window.rootViewController = _rootViewController;

  [_window makeKeyAndVisible];
}

#pragma mark - Background Fetch

#if __has_include(<EXTaskManager/EXTaskService.h>)
- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:EXTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}
#endif

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
#if __has_include(<EXAppAuth/EXAppAuth.h>)
  if ([[EXAppAuth instance] application:app openURL:url options:options]) {
    return YES;
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
#if __has_include(<EXTaskManager/EXTaskService.h>)
  [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:EXTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
#endif
}

@end
