// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXSingletonModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXTaskServiceInterface.h>
#import <ABI49_0_0EXTaskManager/ABI49_0_0EXTask.h>
#import <ABI49_0_0EXTaskManager/ABI49_0_0EXTaskExecutionRequest.h>

@interface ABI49_0_0EXTaskService : ABI49_0_0EXSingletonModule <ABI49_0_0EXTaskServiceInterface, ABI49_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI49_0_0EXTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
