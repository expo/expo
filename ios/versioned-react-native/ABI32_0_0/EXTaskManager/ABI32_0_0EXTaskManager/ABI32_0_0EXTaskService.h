// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXSingletonModule.h>

#import <ABI32_0_0EXTaskManager/ABI32_0_0EXTask.h>
#import <ABI32_0_0EXTaskManager/ABI32_0_0EXTaskExecutionRequest.h>
#import <ABI32_0_0EXTaskManagerInterface/ABI32_0_0EXTaskServiceInterface.h>

@interface ABI32_0_0EXTaskService : ABI32_0_0EXSingletonModule <ABI32_0_0EXTaskServiceInterface, ABI32_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI32_0_0EXTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

@end
