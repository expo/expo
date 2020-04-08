/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventEmitter.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfacePresenterStub.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerUtils.h>

#import "ABI37_0_0RCTValueAnimatedNode.h"

@interface ABI37_0_0RCTNativeAnimatedModule : ABI37_0_0RCTEventEmitter <ABI37_0_0RCTBridgeModule, ABI37_0_0RCTValueAnimatedNodeObserver, ABI37_0_0RCTEventDispatcherObserver, ABI37_0_0RCTUIManagerObserver, ABI37_0_0RCTSurfacePresenterObserver>

@end
