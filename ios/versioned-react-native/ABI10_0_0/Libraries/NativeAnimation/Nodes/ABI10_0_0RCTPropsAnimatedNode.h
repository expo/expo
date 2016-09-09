/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTAnimatedNode.h"

@class ABI10_0_0RCTNativeAnimatedModule;
@class ABI10_0_0RCTViewPropertyMapper;

@interface ABI10_0_0RCTPropsAnimatedNode : ABI10_0_0RCTAnimatedNode

@property (nonatomic, readonly) ABI10_0_0RCTViewPropertyMapper *propertyMapper;

- (void)connectToView:(NSNumber *)viewTag animatedModule:(ABI10_0_0RCTNativeAnimatedModule *)animationModule;
- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)performViewUpdatesIfNecessary;

@end
