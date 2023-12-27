// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXSingletonModule.h>

#import <ABI43_0_0EXTaskManager/ABI43_0_0EXTask.h>
#import <ABI43_0_0EXTaskManager/ABI43_0_0EXTaskExecutionRequest.h>
#import <ABI43_0_0UMTaskManagerInterface/ABI43_0_0UMTaskServiceInterface.h>

@interface ABI43_0_0EXTaskService : ABI43_0_0EXSingletonModule <ABI43_0_0UMTaskServiceInterface, ABI43_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI43_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
