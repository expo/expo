// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMSingletonModule.h>

#import <ABI34_0_0EXTaskManager/ABI34_0_0EXTask.h>
#import <ABI34_0_0EXTaskManager/ABI34_0_0EXTaskExecutionRequest.h>
#import <ABI34_0_0UMTaskManagerInterface/ABI34_0_0UMTaskServiceInterface.h>

@interface ABI34_0_0EXTaskService : ABI34_0_0UMSingletonModule <ABI34_0_0UMTaskServiceInterface, ABI34_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI34_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
