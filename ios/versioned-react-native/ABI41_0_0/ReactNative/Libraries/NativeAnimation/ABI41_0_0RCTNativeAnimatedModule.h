/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventEmitter.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfacePresenterStub.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerUtils.h>

#import "ABI41_0_0RCTValueAnimatedNode.h"

@interface ABI41_0_0RCTNativeAnimatedModule : ABI41_0_0RCTEventEmitter <ABI41_0_0RCTBridgeModule, ABI41_0_0RCTValueAnimatedNodeObserver, ABI41_0_0RCTEventDispatcherObserver, ABI41_0_0RCTUIManagerObserver, ABI41_0_0RCTSurfacePresenterObserver>

@end
