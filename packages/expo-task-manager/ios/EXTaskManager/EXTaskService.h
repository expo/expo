// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXTaskServiceInterface.h>
#import <ExpoTaskManager/EXTask.h>
#import <ExpoTaskManager/EXTaskExecutionRequest.h>

@interface EXTaskService : NSObject <EXTaskServiceInterface, EXTaskDelegate>

@property (nonatomic, nonnull, readonly, class) EXTaskService *shared;

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

@end
