/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventDispatcher.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventEmitter.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManagerUtils.h>

#import "ABI35_0_0RCTValueAnimatedNode.h"

@interface ABI35_0_0RCTNativeAnimatedModule : ABI35_0_0RCTEventEmitter <ABI35_0_0RCTBridgeModule, ABI35_0_0RCTValueAnimatedNodeObserver, ABI35_0_0RCTEventDispatcherObserver, ABI35_0_0RCTUIManagerObserver>

@end
