/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import "ABI8_0_0RCTBridgeModule.h"

@class ABI8_0_0RCTValueAnimatedNode;

NS_ASSUME_NONNULL_BEGIN

@interface ABI8_0_0RCTAnimationDriverNode : NSObject

@property (nonatomic, readonly) NSNumber *animationId;
@property (nonatomic, readonly) NSNumber *outputValue;

@property (nonatomic, readonly) BOOL animationHasBegun;
@property (nonatomic, readonly) BOOL animationHasFinished;

- (instancetype)initWithId:(NSNumber *)animationId
                     delay:(NSTimeInterval)delay
                   toValue:(CGFloat)toValue
                    frames:(NSArray<NSNumber *> *)frames
                   forNode:(ABI8_0_0RCTValueAnimatedNode *)valueNode
                  callBack:(nullable ABI8_0_0RCTResponseSenderBlock)callback NS_DESIGNATED_INITIALIZER;

- (void)startAnimation;
- (void)stopAnimation;
- (void)stepAnimation;
- (void)removeAnimation;
- (void)cleanupAnimationUpdate;

@end

NS_ASSUME_NONNULL_END
