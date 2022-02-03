/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTAnimatedNode.h"

#import <ABI43_0_0React/ABI43_0_0RCTSurfacePresenterStub.h>

@class ABI43_0_0RCTBridge;
@class ABI43_0_0RCTViewPropertyMapper;

@interface ABI43_0_0RCTPropsAnimatedNode : ABI43_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(ABI43_0_0RCTBridge *)bridge
     surfacePresenter:(id<ABI43_0_0RCTSurfacePresenterStub>)surfacePresenter;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
