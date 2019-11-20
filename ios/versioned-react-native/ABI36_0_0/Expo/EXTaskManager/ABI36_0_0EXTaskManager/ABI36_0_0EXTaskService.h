// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMSingletonModule.h>

#import <ABI36_0_0EXTaskManager/ABI36_0_0EXTask.h>
#import <ABI36_0_0EXTaskManager/ABI36_0_0EXTaskExecutionRequest.h>
#import <ABI36_0_0UMTaskManagerInterface/ABI36_0_0UMTaskServiceInterface.h>

@interface ABI36_0_0EXTaskService : ABI36_0_0UMSingletonModule <ABI36_0_0UMTaskServiceInterface, ABI36_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI36_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
