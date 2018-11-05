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

/*!
 An object that can run a given block.
 */
@interface BFExecutor : NSObject

/*!
 Returns a default executor, which runs continuations immediately until the call stack gets too
 deep, then dispatches to a new GCD queue.
 */
+ (instancetype)defaultExecutor;

/*!
 Returns an executor that runs continuations on the thread where the previous task was completed.
 */
+ (instancetype)immediateExecutor;

/*!
 Returns an executor that runs continuations on the main thread.
 */
+ (instancetype)mainThreadExecutor;

/*!
 Returns a new executor that uses the given block to execute continuations.
 @param block The block to use.
 */
+ (instancetype)executorWithBlock:(void(^)(void(^block)(void)))block;

/*!
 Returns a new executor that runs continuations on the given queue.
 @param queue The instance of `dispatch_queue_t` to dispatch all continuations onto.
 */
+ (instancetype)executorWithDispatchQueue:(dispatch_queue_t)queue;

/*!
 Returns a new executor that runs continuations on the given queue.
 @param queue The instance of `NSOperationQueue` to run all continuations on.
 */
+ (instancetype)executorWithOperationQueue:(NSOperationQueue *)queue;

/*!
 Runs the given block using this executor's particular strategy.
 @param block The block to execute.
 */
- (void)execute:(void(^)(void))block;

@end

NS_ASSUME_NONNULL_END
