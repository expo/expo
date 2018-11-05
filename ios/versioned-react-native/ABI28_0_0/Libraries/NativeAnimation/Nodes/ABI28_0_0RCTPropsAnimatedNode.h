/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTAnimatedNode.h"

@class ABI28_0_0RCTUIManager;
@class ABI28_0_0RCTViewPropertyMapper;

@interface ABI28_0_0RCTPropsAnimatedNode : ABI28_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
            uiManager:(ABI28_0_0RCTUIManager *)uiManager;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
