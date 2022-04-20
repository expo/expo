// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXTaskManager/ABI45_0_0EXTaskManagerAppDelegate.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>
#import <ABI45_0_0EXTaskManager/ABI45_0_0EXTaskService.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryProvider.h>

@implementation ABI45_0_0EXTaskManagerAppDelegate

ABI45_0_0EX_REGISTER_SINGLETON_MODULE(ABI45_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI45_0_0EXTaskService *)[ABI45_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI45_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI45_0_0EXTaskService *)[ABI45_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI45_0_0EXTaskService.class] runTasksWithReason:ABI45_0_0EXTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI45_0_0EXTaskService *)[ABI45_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI45_0_0EXTaskService.class] runTasksWithReason:ABI45_0_0EXTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
