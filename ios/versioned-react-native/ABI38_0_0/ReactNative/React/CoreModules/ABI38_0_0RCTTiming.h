/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTFrameUpdate.h>
#import <ABI38_0_0React/ABI38_0_0RCTInvalidating.h>

@protocol ABI38_0_0RCTTimingDelegate

- (void)callTimers:(NSArray<NSNumber *> *)timers;
- (void)immediatelyCallTimer:(nonnull NSNumber *)callbackID;
- (void)callIdleCallbacks:(nonnull NSNumber *)absoluteFrameStartMS;

@end

@interface ABI38_0_0RCTTiming : NSObject <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTInvalidating, ABI38_0_0RCTFrameUpdateObserver>

- (instancetype)initWithDelegate:(id<ABI38_0_0RCTTimingDelegate>) delegate;
- (void)createTimerForNextFrame:(nonnull NSNumber *)callbackID
                       duration:(NSTimeInterval)jsDuration
               jsSchedulingTime:(NSDate *)jsSchedulingTime
                        repeats:(BOOL)repeats;
- (void)deleteTimer:(double)timerID;

@end

