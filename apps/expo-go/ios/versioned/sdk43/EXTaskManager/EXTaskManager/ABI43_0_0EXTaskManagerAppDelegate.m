// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXTaskManager/ABI43_0_0EXTaskManagerAppDelegate.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>
#import <ABI43_0_0EXTaskManager/ABI43_0_0EXTaskService.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryProvider.h>

@implementation ABI43_0_0EXTaskManagerAppDelegate

ABI43_0_0EX_REGISTER_SINGLETON_MODULE(ABI43_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI43_0_0EXTaskService *)[ABI43_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI43_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI43_0_0EXTaskService *)[ABI43_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI43_0_0EXTaskService.class] runTasksWithReason:ABI43_0_0UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI43_0_0EXTaskService *)[ABI43_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI43_0_0EXTaskService.class] runTasksWithReason:ABI43_0_0UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
