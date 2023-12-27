/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTAnimatedNode.h"

#import <ABI44_0_0React/ABI44_0_0RCTSurfacePresenterStub.h>

@class ABI44_0_0RCTBridge;
@class ABI44_0_0RCTViewPropertyMapper;

@interface ABI44_0_0RCTPropsAnimatedNode : ABI44_0_0RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(ABI44_0_0RCTBridge *)bridge
     surfacePresenter:(id<ABI44_0_0RCTSurfacePresenterStub>)surfacePresenter;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
