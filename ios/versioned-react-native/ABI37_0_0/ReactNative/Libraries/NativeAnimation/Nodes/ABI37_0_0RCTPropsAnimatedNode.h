/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTAnimatedNode.h"

@class ABI37_0_0RCTBridge;
@class ABI37_0_0RCTViewPropertyMapper;

@interface ABI37_0_0RCTPropsAnimatedNode : ABI37_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(ABI37_0_0RCTBridge *)bridge;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
