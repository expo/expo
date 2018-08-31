/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventEmitter.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerUtils.h>

#import "ABI30_0_0RCTValueAnimatedNode.h"

@interface ABI30_0_0RCTNativeAnimatedModule : ABI30_0_0RCTEventEmitter <ABI30_0_0RCTBridgeModule, ABI30_0_0RCTValueAnimatedNodeObserver, ABI30_0_0RCTEventDispatcherObserver, ABI30_0_0RCTUIManagerObserver>

@end
