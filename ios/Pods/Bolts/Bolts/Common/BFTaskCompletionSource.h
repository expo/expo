/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class BFTask<__covariant ResultType>;

/*!
 A BFTaskCompletionSource represents the producer side of tasks.
 It is a task that also has methods for changing the state of the
 task by settings its completion values.
 */
@interface BFTaskCompletionSource<__covariant ResultType> : NSObject

/*!
 Creates a new unfinished task.
 */
+ (instancetype)taskCompletionSource;

/*!
 The task associated with this TaskCompletionSource.
 */
@property (nonatomic, strong, readonly) BFTask<ResultType> *task;

/*!
 Completes the task by setting the result.
 Attempting to set this for a completed task will raise an exception.
 @param result The result of the task.
 */
- (void)setResult:(nullable ResultType)result NS_SWIFT_NAME(set(result:));

/*!
 Completes the task by setting the error.
 Attempting to set this for a completed task will raise an exception.
 @param error The error for the task.
 */
- (void)setError:(NSError *)error NS_SWIFT_NAME(set(error:));

/*!
 Completes the task by marking it as cancelled.
 Attempting to set this for a completed task will raise an exception.
 */
- (void)cancel;

/*!
 Sets the result of the task if it wasn't already completed.
 @returns whether the new value was set.
 */
- (BOOL)trySetResult:(nullable ResultType)result NS_SWIFT_NAME(trySet(result:));

/*!
 Sets the error of the task if it wasn't already completed.
 @param error The error for the task.
 @returns whether the new value was set.
 */
- (BOOL)trySetError:(NSError *)error NS_SWIFT_NAME(trySet(error:));

/*!
 Sets the cancellation state of the task if it wasn't already completed.
 @returns whether the new value was set.
 */
- (BOOL)trySetCancelled;

@end

NS_ASSUME_NONNULL_END
