/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI42_0_0RCTAnimatedNode.h"

@class ABI42_0_0RCTValueAnimatedNode;

@protocol ABI42_0_0RCTValueAnimatedNodeObserver <NSObject>

- (void)animatedNode:(ABI42_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value;

@end

@interface ABI42_0_0RCTValueAnimatedNode : ABI42_0_0RCTAnimatedNode

- (void)setOffset:(CGFloat)offset;
- (void)flattenOffset;
- (void)extractOffset;

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, strong) id animatedObject;
@property (nonatomic, weak) id<ABI42_0_0RCTValueAnimatedNodeObserver> valueObserver;

@end
