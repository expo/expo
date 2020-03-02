// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMSingletonModule.h>

#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTask.h>
#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTaskExecutionRequest.h>
#import <ABI37_0_0UMTaskManagerInterface/ABI37_0_0UMTaskServiceInterface.h>

@interface ABI37_0_0EXTaskService : ABI37_0_0UMSingletonModule <ABI37_0_0UMTaskServiceInterface, ABI37_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI37_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
