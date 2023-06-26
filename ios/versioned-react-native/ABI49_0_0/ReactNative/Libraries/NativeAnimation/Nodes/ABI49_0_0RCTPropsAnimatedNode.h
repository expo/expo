/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTAnimatedNode.h"

#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>

@class ABI49_0_0RCTBridge;
@class ABI49_0_0RCTViewPropertyMapper;

@interface ABI49_0_0RCTPropsAnimatedNode : ABI49_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(ABI49_0_0RCTBridge *)bridge
     surfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
