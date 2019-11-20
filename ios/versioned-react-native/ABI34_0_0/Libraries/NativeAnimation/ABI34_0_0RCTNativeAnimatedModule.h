/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventEmitter.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerUtils.h>

#import "ABI34_0_0RCTValueAnimatedNode.h"

@interface ABI34_0_0RCTNativeAnimatedModule : ABI34_0_0RCTEventEmitter <ABI34_0_0RCTBridgeModule, ABI34_0_0RCTValueAnimatedNodeObserver, ABI34_0_0RCTEventDispatcherObserver, ABI34_0_0RCTUIManagerObserver>

@end
