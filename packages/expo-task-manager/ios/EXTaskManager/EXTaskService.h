// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSingletonModule.h>

#import <EXTaskManager/EXTask.h>
#import <EXTaskManager/EXTaskExecutionRequest.h>
#import <UMTaskManagerInterface/UMTaskServiceInterface.h>

@interface EXTaskService : EXSingletonModule <UMTaskServiceInterface, EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
