// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXTaskManager/ABI34_0_0EXTaskManagerAppDelegate.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMDefines.h>
#import <ABI34_0_0EXTaskManager/ABI34_0_0EXTaskService.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryProvider.h>

@implementation ABI34_0_0EXTaskManagerAppDelegate

ABI34_0_0UM_REGISTER_SINGLETON_MODULE(ABI34_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI34_0_0EXTaskService *)[ABI34_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI34_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI34_0_0EXTaskService *)[ABI34_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI34_0_0EXTaskService.class] runTasksWithReason:ABI34_0_0UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI34_0_0EXTaskService *)[ABI34_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI34_0_0EXTaskService.class] runTasksWithReason:ABI34_0_0UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
