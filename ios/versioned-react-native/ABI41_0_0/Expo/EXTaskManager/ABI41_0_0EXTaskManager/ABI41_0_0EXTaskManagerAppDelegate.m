// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXTaskManager/ABI41_0_0EXTaskManagerAppDelegate.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMDefines.h>
#import <ABI41_0_0EXTaskManager/ABI41_0_0EXTaskService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryProvider.h>

@implementation ABI41_0_0EXTaskManagerAppDelegate

ABI41_0_0UM_REGISTER_SINGLETON_MODULE(ABI41_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI41_0_0EXTaskService *)[ABI41_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI41_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI41_0_0EXTaskService *)[ABI41_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI41_0_0EXTaskService.class] runTasksWithReason:ABI41_0_0UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI41_0_0EXTaskService *)[ABI41_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI41_0_0EXTaskService.class] runTasksWithReason:ABI41_0_0UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
