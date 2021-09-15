// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMSingletonModule.h>

#import <ABI42_0_0EXTaskManager/ABI42_0_0EXTask.h>
#import <ABI42_0_0EXTaskManager/ABI42_0_0EXTaskExecutionRequest.h>
#import <ABI42_0_0UMTaskManagerInterface/ABI42_0_0UMTaskServiceInterface.h>

@interface ABI42_0_0EXTaskService : ABI42_0_0UMSingletonModule <ABI42_0_0UMTaskServiceInterface, ABI42_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI42_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
