/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventEmitter.h>
#import <ABI39_0_0React/ABI39_0_0RCTSurfacePresenterStub.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerUtils.h>

#import "ABI39_0_0RCTValueAnimatedNode.h"

@interface ABI39_0_0RCTNativeAnimatedModule : ABI39_0_0RCTEventEmitter <ABI39_0_0RCTBridgeModule, ABI39_0_0RCTValueAnimatedNodeObserver, ABI39_0_0RCTEventDispatcherObserver, ABI39_0_0RCTUIManagerObserver, ABI39_0_0RCTSurfacePresenterObserver>

@end
