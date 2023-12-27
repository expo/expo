/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>
#import <ABI42_0_0React/ABI42_0_0RCTSurfacePresenterStub.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerUtils.h>

#import "ABI42_0_0RCTValueAnimatedNode.h"

@interface ABI42_0_0RCTNativeAnimatedModule : ABI42_0_0RCTEventEmitter <ABI42_0_0RCTBridgeModule, ABI42_0_0RCTValueAnimatedNodeObserver, ABI42_0_0RCTEventDispatcherObserver, ABI42_0_0RCTUIManagerObserver, ABI42_0_0RCTSurfacePresenterObserver>

@end
