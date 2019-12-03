// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMSingletonModule.h>

#import <ABI35_0_0EXTaskManager/ABI35_0_0EXTask.h>
#import <ABI35_0_0EXTaskManager/ABI35_0_0EXTaskExecutionRequest.h>
#import <ABI35_0_0UMTaskManagerInterface/ABI35_0_0UMTaskServiceInterface.h>

@interface ABI35_0_0EXTaskService : ABI35_0_0UMSingletonModule <ABI35_0_0UMTaskServiceInterface, ABI35_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI35_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
