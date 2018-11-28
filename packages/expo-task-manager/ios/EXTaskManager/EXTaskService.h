// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCore/EXSingletonModule.h>

#import <EXTaskManager/EXTask.h>
#import <EXTaskManager/EXTaskExecutionRequest.h>
#import <EXTaskManagerInterface/EXTaskServiceInterface.h>

@interface EXTaskService : EXSingletonModule <EXTaskServiceInterface, EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (void)runTasksWithReason:(EXTaskLaunchReason)launchReason
                  userInfo:(nullable NSDictionary *)userInfo
         completionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

@end
