// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0EXTaskManager/ABI33_0_0EXTaskManagerAppDelegate.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMDefines.h>
#import <ABI33_0_0EXTaskManager/ABI33_0_0EXTaskService.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryProvider.h>

@implementation ABI33_0_0EXTaskManagerAppDelegate

ABI33_0_0UM_REGISTER_SINGLETON_MODULE(ABI33_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI33_0_0EXTaskService *)[ABI33_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI33_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI33_0_0EXTaskService *)[ABI33_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI33_0_0EXTaskService.class] runTasksWithReason:ABI33_0_0UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI33_0_0EXTaskService *)[ABI33_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI33_0_0EXTaskService.class] runTasksWithReason:ABI33_0_0UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
