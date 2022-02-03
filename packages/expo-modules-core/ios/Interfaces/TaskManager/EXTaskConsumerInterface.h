// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXTaskInterface.h>
#import <ExpoModulesCore/EXTaskLaunchReason.h>

// Interface for task consumers. Task consumers are the objects that are responsible for handling tasks.
// Consumers are getting signals from TaskManager (and service) about a few events that are happening during task's lifecycle.

@protocol EXTaskConsumerInterface <NSObject>

@property (nonatomic, strong) id<EXTaskInterface> __nullable task;

@required

/**
 *  The type of the task, like "location" or "geofencing".
 */
- (nonnull NSString *)taskType;

/**
 *  Called by EXTaskService when the task is created and associated with the consumer.
 */
- (void)didRegisterTask:(nonnull id<EXTaskInterface>)task;

@optional

/**
 *  Static method returning boolean value whether the consumer supports launch reason.
 */
+ (BOOL)supportsLaunchReason:(EXTaskLaunchReason)launchReason;

/**
 *  Version of the consumer. Increase returned number in case of any breaking changes made to the task consumer,
 *  so the existing tasks will be automatically unregistered when the native code gets upgraded.
 */
+ (NSUInteger)taskConsumerVersion;

/**
 *  Sets options for the task.
 */
- (void)setOptions:(nonnull NSDictionary *)options;

/**
 *  Called by EXTaskService to inform the consumer that the associated task is ready to be executed with accompanying data.
 */
- (void)didBecomeReadyToExecuteWithData:(nullable NSDictionary *)data;

/**
 *  Called right after the task has been unregistered.
 */
- (void)didUnregister;

/**
 *  Called by EXTaskManager when the task has been completed and we received a result from JS app.
 */
- (void)didFinish;

/**
 *  Method used to normalize task result that comes from JS app.
 */
- (NSUInteger)normalizeTaskResult:(nullable id)result;

@end
