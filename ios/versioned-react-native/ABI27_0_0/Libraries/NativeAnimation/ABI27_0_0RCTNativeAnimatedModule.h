/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventDispatcher.h>
#import <ReactABI27_0_0/ABI27_0_0RCTEventEmitter.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManagerUtils.h>

#import "ABI27_0_0RCTValueAnimatedNode.h"

@interface ABI27_0_0RCTNativeAnimatedModule : ABI27_0_0RCTEventEmitter <ABI27_0_0RCTBridgeModule, ABI27_0_0RCTValueAnimatedNodeObserver, ABI27_0_0RCTEventDispatcherObserver, ABI27_0_0RCTUIManagerObserver>

@end
