/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTAnimatedNode.h"
#import <UIKit/UIKit.h>

@class ABI10_0_0RCTValueAnimatedNode;

@protocol ABI10_0_0RCTValueAnimatedNodeObserver <NSObject>

- (void)animatedNode:(ABI10_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value;

@end

@interface ABI10_0_0RCTValueAnimatedNode : ABI10_0_0RCTAnimatedNode

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, weak) id<ABI10_0_0RCTValueAnimatedNodeObserver> valueObserver;

@end
