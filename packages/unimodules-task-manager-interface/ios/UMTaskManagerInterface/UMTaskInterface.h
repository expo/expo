// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// forward declaration for consumer interface
@protocol UMTaskConsumerInterface;

@protocol UMTaskInterface

/**
 *  Name of the task.
 */
@property (nonatomic, strong, readonly) NSString *__nonnull name;

/**
 *  Identifier of the application for which the task was created.
 */
@property (nonatomic, strong, readonly) NSString *__nonnull appId;

/**
 *  The URL to the application for which the task was created.
 */
@property (nonatomic, strong, readonly) NSString *__nonnull appUrl;

/**
 *  Task consumer instance that is responsible for handling (consuming) this task.
 */
@property (nonatomic, strong, readonly) id<UMTaskConsumerInterface> __nonnull consumer;

/**
 *  Options passed to the task.
 */
@property (nonatomic, strong) NSDictionary *__nullable options;

/**
 *  Executes the task with given dictionary data and given error.
 */
- (void)executeWithData:(nullable NSDictionary *)data withError:(nullable NSError *)error;

@end
