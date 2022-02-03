// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXTaskManager/ABI44_0_0EXTaskManagerAppDelegate.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>
#import <ABI44_0_0EXTaskManager/ABI44_0_0EXTaskService.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryProvider.h>

@implementation ABI44_0_0EXTaskManagerAppDelegate

ABI44_0_0EX_REGISTER_SINGLETON_MODULE(ABI44_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI44_0_0EXTaskService *)[ABI44_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI44_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI44_0_0EXTaskService *)[ABI44_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI44_0_0EXTaskService.class] runTasksWithReason:ABI44_0_0UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI44_0_0EXTaskService *)[ABI44_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI44_0_0EXTaskService.class] runTasksWithReason:ABI44_0_0UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
