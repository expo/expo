// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXTaskManager/ABI36_0_0EXTaskManagerAppDelegate.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMDefines.h>
#import <ABI36_0_0EXTaskManager/ABI36_0_0EXTaskService.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryProvider.h>

@implementation ABI36_0_0EXTaskManagerAppDelegate

ABI36_0_0UM_REGISTER_SINGLETON_MODULE(ABI36_0_0EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(ABI36_0_0EXTaskService *)[ABI36_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI36_0_0EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(ABI36_0_0EXTaskService *)[ABI36_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI36_0_0EXTaskService.class] runTasksWithReason:ABI36_0_0UMTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(ABI36_0_0EXTaskService *)[ABI36_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI36_0_0EXTaskService.class] runTasksWithReason:ABI36_0_0UMTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
