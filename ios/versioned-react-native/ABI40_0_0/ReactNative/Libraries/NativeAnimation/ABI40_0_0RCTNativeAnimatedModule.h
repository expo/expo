/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventDispatcher.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventEmitter.h>
#import <ABI40_0_0React/ABI40_0_0RCTSurfacePresenterStub.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManagerUtils.h>

#import "ABI40_0_0RCTValueAnimatedNode.h"

@interface ABI40_0_0RCTNativeAnimatedModule : ABI40_0_0RCTEventEmitter <ABI40_0_0RCTBridgeModule, ABI40_0_0RCTValueAnimatedNodeObserver, ABI40_0_0RCTEventDispatcherObserver, ABI40_0_0RCTUIManagerObserver, ABI40_0_0RCTSurfacePresenterObserver>

@end
