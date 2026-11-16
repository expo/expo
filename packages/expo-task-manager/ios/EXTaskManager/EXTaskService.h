// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXTaskServiceInterface.h>
#import <ExpoTaskManager/EXTask.h>
#import <ExpoTaskManager/EXTaskExecutionRequest.h>

/**
 *  A task consumer that also gets the response the JS app reported for each event of its task.
 */
@protocol EXTaskResponseConsumer <EXTaskConsumerInterface>

/**
 *  Called with the raw response of an event: `eventId`, `result` and an optional `error`.
 */
- (void)didFinishEventWithResponse:(nonnull NSDictionary *)response;

@end

@interface EXTaskService : NSObject <EXTaskServiceInterface, EXTaskDelegate>

@property (nonatomic, nonnull, readonly, class) EXTaskService *shared;

/**
 *  Atomically returns the task registered with given name and appId, whatever its consumer class, without
 *  modifying it. Registers a new task with given consumer class only when the name is free.
 */
- (nonnull id<EXTaskInterface>)registerTaskIfAbsentWithName:(nonnull NSString *)taskName
                                                      appId:(nonnull NSString *)appId
                                                     appUrl:(nullable NSString *)appUrl
                                              consumerClass:(nonnull Class)consumerClass
                                                    options:(nullable NSDictionary *)options
  NS_SWIFT_NAME(getOrRegisterTask(withName:appId:appUrl:consumerClass:options:));

+ (BOOL)hasBackgroundModeEnabled:(nonnull NSString *)backgroundMode;

// AppDelegate handlers
- (void)applicationDidFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;

@end
