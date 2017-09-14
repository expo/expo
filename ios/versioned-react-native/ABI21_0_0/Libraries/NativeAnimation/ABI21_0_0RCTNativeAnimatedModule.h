/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventEmitter.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI21_0_0RCTValueAnimatedNode.h"

@interface ABI21_0_0RCTNativeAnimatedModule : ABI21_0_0RCTEventEmitter <ABI21_0_0RCTBridgeModule, ABI21_0_0RCTValueAnimatedNodeObserver, ABI21_0_0RCTEventDispatcherObserver, ABI21_0_0RCTUIManagerObserver>

@end
