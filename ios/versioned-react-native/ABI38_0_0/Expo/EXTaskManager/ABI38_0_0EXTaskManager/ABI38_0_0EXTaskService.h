// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMSingletonModule.h>

#import <ABI38_0_0EXTaskManager/ABI38_0_0EXTask.h>
#import <ABI38_0_0EXTaskManager/ABI38_0_0EXTaskExecutionRequest.h>
#import <ABI38_0_0UMTaskManagerInterface/ABI38_0_0UMTaskServiceInterface.h>

@interface ABI38_0_0EXTaskService : ABI38_0_0UMSingletonModule <ABI38_0_0UMTaskServiceInterface, ABI38_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI38_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
