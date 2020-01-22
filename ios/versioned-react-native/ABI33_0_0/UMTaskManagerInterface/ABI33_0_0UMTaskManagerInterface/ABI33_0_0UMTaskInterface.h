// Copyright 2015-present 650 Industries. All rights reserved.

// forward declaration for consumer interface
@protocol ABI33_0_0UMTaskConsumerInterface;

@protocol ABI33_0_0UMTaskInterface

/**
 *  Name of the task.
 */
@property (nonatomic, strong, readonly) NSString *name;

/**
 *  Identifier of the application for which the task was created.
 */
@property (nonatomic, strong, readonly) NSString *appId;

/**
 *  The URL to the application for which the task was created.
 */
@property (nonatomic, strong, readonly) NSString *appUrl;

/**
 *  Task consumer instance that is responsible for handling (consuming) this task.
 */
@property (nonatomic, strong, readonly) id<ABI33_0_0UMTaskConsumerInterface> consumer;

/**
 *  Options passed to the task.
 */
@property (nonatomic, strong) NSDictionary *options;

/**
 *  Executes the task with given dictionary data and given error.
 */
- (void)executeWithData:(nullable NSDictionary *)data withError:(nullable NSError *)error;

@end
