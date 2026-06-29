// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoTaskManager/EXTask.h>
#import <ExpoTaskManager/EXTaskExecutionRequest.h>

@import ExpoModulesCore;

@interface EXTaskService : NSObject <EXTaskServiceInterface, EXTaskDelegate>

@property (nonatomic, nonnull, readonly, class) EXTaskService *shared;

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

@end
