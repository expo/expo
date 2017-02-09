/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTAnimatedNode.h"

@class ABI14_0_0RCTUIManager;
@class ABI14_0_0RCTViewPropertyMapper;

@interface ABI14_0_0RCTPropsAnimatedNode : ABI14_0_0RCTAnimatedNode

@property (nonatomic, readonly) ABI14_0_0RCTViewPropertyMapper *propertyMapper;

- (void)connectToView:(NSNumber *)viewTag uiManager:(ABI14_0_0RCTUIManager *)uiManager;
- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)performViewUpdatesIfNecessary;

@end
