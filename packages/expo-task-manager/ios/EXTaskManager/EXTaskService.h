// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXSingletonModule.h>
#import <ExpoModulesCore/EXTaskServiceInterface.h>
#import <EXTaskManager/EXTask.h>
#import <EXTaskManager/EXTaskExecutionRequest.h>

@interface EXTaskService : EXSingletonModule <EXTaskServiceInterface, EXTaskDelegate>

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

@end
