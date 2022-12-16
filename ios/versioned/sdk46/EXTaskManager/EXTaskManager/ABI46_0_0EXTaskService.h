// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXSingletonModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXTaskServiceInterface.h>
#import <ABI46_0_0EXTaskManager/ABI46_0_0EXTask.h>
#import <ABI46_0_0EXTaskManager/ABI46_0_0EXTaskExecutionRequest.h>

@interface ABI46_0_0EXTaskService : ABI46_0_0EXSingletonModule <ABI46_0_0EXTaskServiceInterface, ABI46_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI46_0_0EXTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
