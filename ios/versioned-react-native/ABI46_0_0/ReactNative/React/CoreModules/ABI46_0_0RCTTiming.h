/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTFrameUpdate.h>
#import <ABI46_0_0React/ABI46_0_0RCTInitializing.h>
#import <ABI46_0_0React/ABI46_0_0RCTInvalidating.h>

@protocol ABI46_0_0RCTTimingDelegate

- (void)callTimers:(NSArray<NSNumber *> *)timers;
- (void)immediatelyCallTimer:(nonnull NSNumber *)callbackID;
- (void)callIdleCallbacks:(nonnull NSNumber *)absoluteFrameStartMS;

@end

@interface ABI46_0_0RCTTiming : NSObject <ABI46_0_0RCTBridgeModule, ABI46_0_0RCTInvalidating, ABI46_0_0RCTFrameUpdateObserver, ABI46_0_0RCTInitializing>

- (instancetype)initWithDelegate:(id<ABI46_0_0RCTTimingDelegate>)delegate;
- (void)createTimerForNextFrame:(nonnull NSNumber *)callbackID
                       duration:(NSTimeInterval)jsDuration
               jsSchedulingTime:(NSDate *)jsSchedulingTime
                        repeats:(BOOL)repeats;
- (void)deleteTimer:(double)timerID;

@end
