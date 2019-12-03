/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventEmitter.h>
#import <ABI36_0_0React/ABI36_0_0RCTSurfacePresenterStub.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerUtils.h>

#import "ABI36_0_0RCTValueAnimatedNode.h"

@interface ABI36_0_0RCTNativeAnimatedModule : ABI36_0_0RCTEventEmitter <ABI36_0_0RCTBridgeModule, ABI36_0_0RCTValueAnimatedNodeObserver, ABI36_0_0RCTEventDispatcherObserver, ABI36_0_0RCTUIManagerObserver, ABI36_0_0RCTSurfacePresenterObserver>

@end
