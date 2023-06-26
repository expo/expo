// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXTaskManager/ABI49_0_0EXTaskManagerAppDelegate.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXDefines.h>
#import <ABI49_0_0EXTaskManager/ABI49_0_0EXTaskService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryProvider.h>

@implementation ABI49_0_0EXTaskManagerAppDelegate

ABI49_0_0EX_REGISTER_SINGLETON_MODULE(ABI49_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI49_0_0EXTaskService *)[ABI49_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI49_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI49_0_0EXTaskService *)[ABI49_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI49_0_0EXTaskService.class] runTasksWithReason:ABI49_0_0EXTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI49_0_0EXTaskService *)[ABI49_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI49_0_0EXTaskService.class] runTasksWithReason:ABI49_0_0EXTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
