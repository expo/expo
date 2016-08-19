/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTAnimatedNode.h"

@class ABI9_0_0RCTNativeAnimatedModule;
@class ABI9_0_0RCTViewPropertyMapper;

@interface ABI9_0_0RCTPropsAnimatedNode : ABI9_0_0RCTAnimatedNode

@property (nonatomic, readonly) ABI9_0_0RCTViewPropertyMapper *propertyMapper;

- (void)connectToView:(NSNumber *)viewTag animatedModule:(ABI9_0_0RCTNativeAnimatedModule *)animationModule;
- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)performViewUpdatesIfNecessary;

@end
