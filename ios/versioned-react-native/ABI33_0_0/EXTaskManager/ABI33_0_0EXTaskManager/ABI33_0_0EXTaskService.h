// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMSingletonModule.h>

#import <ABI33_0_0EXTaskManager/ABI33_0_0EXTask.h>
#import <ABI33_0_0EXTaskManager/ABI33_0_0EXTaskExecutionRequest.h>
#import <ABI33_0_0UMTaskManagerInterface/ABI33_0_0UMTaskServiceInterface.h>

@interface ABI33_0_0EXTaskService : ABI33_0_0UMSingletonModule <ABI33_0_0UMTaskServiceInterface, ABI33_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI33_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

@end
