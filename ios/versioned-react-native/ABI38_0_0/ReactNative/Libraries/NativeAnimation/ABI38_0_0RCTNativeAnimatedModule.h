/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventEmitter.h>
#import <ABI38_0_0React/ABI38_0_0RCTSurfacePresenterStub.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerUtils.h>

#import "ABI38_0_0RCTValueAnimatedNode.h"

@interface ABI38_0_0RCTNativeAnimatedModule : ABI38_0_0RCTEventEmitter <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTValueAnimatedNodeObserver, ABI38_0_0RCTEventDispatcherObserver, ABI38_0_0RCTUIManagerObserver, ABI38_0_0RCTSurfacePresenterObserver>

@end
