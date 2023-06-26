/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTAnimationType.h>

@interface ABI49_0_0RCTLayoutAnimation : NSObject

@property (nonatomic, readonly) NSTimeInterval duration;
@property (nonatomic, readonly) NSTimeInterval delay;
@property (nonatomic, readonly, copy) NSString *property ;
@property (nonatomic, readonly) CGFloat springDamping;
@property (nonatomic, readonly) CGFloat initialVelocity;
@property (nonatomic, readonly) ABI49_0_0RCTAnimationType animationType;

+ (void)initializeStatics;

- (instancetype)initWithDuration:(NSTimeInterval)duration
                           delay:(NSTimeInterval)delay
                        property:(NSString *)property
                   springDamping:(CGFloat)springDamping
                 initialVelocity:(CGFloat)initialVelocity
                   animationType:(ABI49_0_0RCTAnimationType)animationType;

- (instancetype)initWithDuration:(NSTimeInterval)duration config:(NSDictionary *)config;

- (void)performAnimations:(void (^)(void))animations withCompletionBlock:(void (^)(BOOL completed))completionBlock;

@end
