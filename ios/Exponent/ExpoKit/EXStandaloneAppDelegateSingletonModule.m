// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXStandaloneAppDelegateSingletonModule.h"

#import "ExpoKit.h"
#import "EXViewController.h"

#import <UMCore/UMModuleRegistryProvider.h>

#if __has_include(<EXAppAuth/EXAppAuth.h>)
#import <EXAppAuth/EXAppAuth.h>
#endif

#if __has_include(<GoogleSignIn/GoogleSignIn.h>)
#import <GoogleSignIn/GoogleSignIn.h>
#endif

#if __has_include(<EXTaskManager/EXTaskService.h>)
#import <EXTaskManager/EXTaskService.h>
#endif

#if __has_include(<EXFacebook/EXFacebook.h>)
#import <EXFacebook/EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#endif

@implementation EXStandaloneAppDelegateSingletonModule

UM_REGISTER_SINGLETON_MODULE(EXStandaloneAppDelegateSingletonModule)

#pragma mark - Background Fetch

#if __has_include(<EXTaskManager/EXTaskService.h>)
- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(EXTaskService *)[UMModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
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
#if __has_include(<EXAppAuth/EXAppAuthSessionsManager.h>)
  if ([(EXAppAuthSessionsManager *)[UMModuleRegistryProvider getSingletonModuleForClass:EXAppAuthSessionsManager.class] application:app openURL:url options:options]) {
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
#if __has_include(<EXTaskManager/EXTaskService.h>)
  [(EXTaskService *)[UMModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
#endif
}


@end
