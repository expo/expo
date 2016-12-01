/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTAnimatedNode.h"
#import <UIKit/UIKit.h>

@class ABI12_0_0RCTValueAnimatedNode;

@protocol ABI12_0_0RCTValueAnimatedNodeObserver <NSObject>

- (void)animatedNode:(ABI12_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value;

@end

@interface ABI12_0_0RCTValueAnimatedNode : ABI12_0_0RCTAnimatedNode

- (void)setOffset:(CGFloat)offset;
- (void)flattenOffset;

@property (nonatomic, assign) CGFloat value;
@property (nonatomic, weak) id<ABI12_0_0RCTValueAnimatedNodeObserver> valueObserver;

@end
