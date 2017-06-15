/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTAnimatedNode.h"

@class ABI18_0_0RCTUIManager;
@class ABI18_0_0RCTViewPropertyMapper;

@interface ABI18_0_0RCTPropsAnimatedNode : ABI18_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
            uiManager:(ABI18_0_0RCTUIManager *)uiManager;

- (void)disconnectFromView:(NSNumber *)viewTag;

@end
