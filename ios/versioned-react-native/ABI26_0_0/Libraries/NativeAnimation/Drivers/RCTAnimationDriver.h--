/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <ReactABI26_0_0/ABI26_0_0RCTBridgeModule.h>

static CGFloat ABI26_0_0RCTSingleFrameInterval = 1.0 / 60.0;

@class ABI26_0_0RCTValueAnimatedNode;

NS_ASSUME_NONNULL_BEGIN

@protocol ABI26_0_0RCTAnimationDriver <NSObject>

@property (nonatomic, readonly) NSNumber *animationId;
@property (nonatomic, readonly) ABI26_0_0RCTValueAnimatedNode *valueNode;
@property (nonatomic, readonly) BOOL animationHasBegun;
@property (nonatomic, readonly) BOOL animationHasFinished;

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(ABI26_0_0RCTValueAnimatedNode *)valueNode
                  callBack:(nullable ABI26_0_0RCTResponseSenderBlock)callback;

- (void)startAnimation;
- (void)stepAnimationWithTime:(NSTimeInterval)currentTime;
- (void)stopAnimation;

NS_ASSUME_NONNULL_END

@end
