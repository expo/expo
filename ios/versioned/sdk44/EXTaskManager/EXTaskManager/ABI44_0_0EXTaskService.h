// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXSingletonModule.h>

#import <ABI44_0_0EXTaskManager/ABI44_0_0EXTask.h>
#import <ABI44_0_0EXTaskManager/ABI44_0_0EXTaskExecutionRequest.h>
#import <ABI44_0_0UMTaskManagerInterface/ABI44_0_0UMTaskServiceInterface.h>

@interface ABI44_0_0EXTaskService : ABI44_0_0EXSingletonModule <ABI44_0_0UMTaskServiceInterface, ABI44_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI44_0_0UMTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
