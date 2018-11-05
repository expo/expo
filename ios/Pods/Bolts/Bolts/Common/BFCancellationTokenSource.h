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

@class BFCancellationToken;

/*!
 BFCancellationTokenSource represents the producer side of a CancellationToken.
 Signals to a CancellationToken that it should be canceled.
 It is a cancellation token that also has methods
 for changing the state of a token by cancelling it.
 */
@interface BFCancellationTokenSource : NSObject

/*!
 Creates a new cancellation token source.
 */
+ (instancetype)cancellationTokenSource;

/*!
 The cancellation token associated with this CancellationTokenSource.
 */
@property (nonatomic, strong, readonly) BFCancellationToken *token;

/*!
 Whether cancellation has been requested for this token source.
 */
@property (nonatomic, assign, readonly, getter=isCancellationRequested) BOOL cancellationRequested;

/*!
 Cancels the token if it has not already been cancelled.
 */
- (void)cancel;

/*!
 Schedules a cancel operation on this CancellationTokenSource after the specified number of milliseconds.
 @param millis The number of milliseconds to wait before completing the returned task.
 If delay is `0` the cancel is executed immediately. If delay is `-1` any scheduled cancellation is stopped.
 */
- (void)cancelAfterDelay:(int)millis;

/*!
 Releases all resources associated with this token source,
 including disposing of all registrations.
 */
- (void)dispose;

@end

NS_ASSUME_NONNULL_END
