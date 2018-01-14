/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventDispatcher.h>
#import <ReactABI25_0_0/ABI25_0_0RCTEventEmitter.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManagerUtils.h>

#import "ABI25_0_0RCTValueAnimatedNode.h"

@interface ABI25_0_0RCTNativeAnimatedModule : ABI25_0_0RCTEventEmitter <ABI25_0_0RCTBridgeModule, ABI25_0_0RCTValueAnimatedNodeObserver, ABI25_0_0RCTEventDispatcherObserver, ABI25_0_0RCTUIManagerObserver>

@end
