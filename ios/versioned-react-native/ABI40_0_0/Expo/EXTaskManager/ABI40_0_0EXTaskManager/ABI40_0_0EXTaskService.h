// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMSingletonModule.h>

#import <ABI40_0_0EXTaskManager/ABI40_0_0EXTask.h>
#import <ABI40_0_0EXTaskManager/ABI40_0_0EXTaskExecutionRequest.h>
#import <ABI40_0_0UMTaskManagerInterface/ABI40_0_0UMTaskServiceInterface.h>

@interface ABI40_0_0EXTaskService : ABI40_0_0UMSingletonModule <ABI40_0_0UMTaskServiceInterface, ABI40_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI40_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
