// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMSingletonModule.h>

#import <ABI41_0_0EXTaskManager/ABI41_0_0EXTask.h>
#import <ABI41_0_0EXTaskManager/ABI41_0_0EXTaskExecutionRequest.h>
#import <ABI41_0_0UMTaskManagerInterface/ABI41_0_0UMTaskServiceInterface.h>

@interface ABI41_0_0EXTaskService : ABI41_0_0UMSingletonModule <ABI41_0_0UMTaskServiceInterface, ABI41_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI41_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
