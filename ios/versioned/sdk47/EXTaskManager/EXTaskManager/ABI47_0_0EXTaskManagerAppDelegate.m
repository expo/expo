// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXTaskManager/ABI47_0_0EXTaskManagerAppDelegate.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>
#import <ABI47_0_0EXTaskManager/ABI47_0_0EXTaskService.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryProvider.h>

@implementation ABI47_0_0EXTaskManagerAppDelegate

ABI47_0_0EX_REGISTER_SINGLETON_MODULE(ABI47_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI47_0_0EXTaskService *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI47_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI47_0_0EXTaskService *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI47_0_0EXTaskService.class] runTasksWithReason:ABI47_0_0EXTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI47_0_0EXTaskService *)[ABI47_0_0EXModuleRegistryProvider getSingletonModuleForClass:ABI47_0_0EXTaskService.class] runTasksWithReason:ABI47_0_0EXTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
