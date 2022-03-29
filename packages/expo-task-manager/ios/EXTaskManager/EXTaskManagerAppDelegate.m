// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXTaskManager/EXTaskManagerAppDelegate.h>
#import <ExpoModulesCore/EXDefines.h>
#import <EXTaskManager/EXTaskService.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

@implementation EXTaskManagerAppDelegate

EX_REGISTER_SINGLETON_MODULE(EXTaskManagerAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] applicationDidFinishLaunchingWithOptions:launchOptions];
  
  return NO;
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:EXTaskLaunchReasonBackgroundFetch userInfo:nil completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  [(EXTaskService *)[EXModuleRegistryProvider getSingletonModuleForClass:EXTaskService.class] runTasksWithReason:EXTaskLaunchReasonRemoteNotification userInfo:userInfo completionHandler:completionHandler];
}

@end
