/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI44_0_0RCTAnimatedNode.h"

@class ABI44_0_0RCTValueAnimatedNode;

@protocol ABI44_0_0RCTValueAnimatedNodeObserver <NSObject>

- (void)animatedNode:(ABI44_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value;

@end

@interface ABI44_0_0RCTValueAnimatedNode : ABI44_0_0RCTAnimatedNode

- (void)setOffset:(CGFloat)offset;
- (void)flattenOffset;
- (void)extractOffset;

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, strong) id animatedObject;
@property (nonatomic, weak) id<ABI44_0_0RCTValueAnimatedNodeObserver> valueObserver;

@end
