// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXSingletonModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXTaskServiceInterface.h>
#import <ABI45_0_0EXTaskManager/ABI45_0_0EXTask.h>
#import <ABI45_0_0EXTaskManager/ABI45_0_0EXTaskExecutionRequest.h>

@interface ABI45_0_0EXTaskService : ABI45_0_0EXSingletonModule <ABI45_0_0EXTaskServiceInterface, ABI45_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI45_0_0EXTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
