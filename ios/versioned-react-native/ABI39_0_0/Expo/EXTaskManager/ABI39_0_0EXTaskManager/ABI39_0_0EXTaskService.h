// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMSingletonModule.h>

#import <ABI39_0_0EXTaskManager/ABI39_0_0EXTask.h>
#import <ABI39_0_0EXTaskManager/ABI39_0_0EXTaskExecutionRequest.h>
#import <ABI39_0_0UMTaskManagerInterface/ABI39_0_0UMTaskServiceInterface.h>

@interface ABI39_0_0EXTaskService : ABI39_0_0UMSingletonModule <ABI39_0_0UMTaskServiceInterface, ABI39_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI39_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
