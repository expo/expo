// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXSingletonModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXTaskServiceInterface.h>
#import <ABI47_0_0EXTaskManager/ABI47_0_0EXTask.h>
#import <ABI47_0_0EXTaskManager/ABI47_0_0EXTaskExecutionRequest.h>

@interface ABI47_0_0EXTaskService : ABI47_0_0EXSingletonModule <ABI47_0_0EXTaskServiceInterface, ABI47_0_0EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(ABI47_0_0EXTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(nullable void (^)(UIBackgroundFetchResult))completionHandler;

@end
