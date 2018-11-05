/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI26_0_0/ABI26_0_0RCTBridgeModule.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventDispatcher.h>
#import <ReactABI26_0_0/ABI26_0_0RCTEventEmitter.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManagerUtils.h>

#import "ABI26_0_0RCTValueAnimatedNode.h"

@interface ABI26_0_0RCTNativeAnimatedModule : ABI26_0_0RCTEventEmitter <ABI26_0_0RCTBridgeModule, ABI26_0_0RCTValueAnimatedNodeObserver, ABI26_0_0RCTEventDispatcherObserver, ABI26_0_0RCTUIManagerObserver>

@end
