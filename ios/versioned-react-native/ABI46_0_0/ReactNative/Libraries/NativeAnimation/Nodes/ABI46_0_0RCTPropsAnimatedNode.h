/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTAnimatedNode.h"

#import <ABI46_0_0React/ABI46_0_0RCTSurfacePresenterStub.h>

@class ABI46_0_0RCTBridge;
@class ABI46_0_0RCTViewPropertyMapper;

@interface ABI46_0_0RCTPropsAnimatedNode : ABI46_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(ABI46_0_0RCTBridge *)bridge
     surfacePresenter:(id<ABI46_0_0RCTSurfacePresenterStub>)surfacePresenter;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
