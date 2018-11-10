/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventDispatcher.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventEmitter.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerUtils.h>

#import "ABI31_0_0RCTValueAnimatedNode.h"

@interface ABI31_0_0RCTNativeAnimatedModule : ABI31_0_0RCTEventEmitter <ABI31_0_0RCTBridgeModule, ABI31_0_0RCTValueAnimatedNodeObserver, ABI31_0_0RCTEventDispatcherObserver, ABI31_0_0RCTUIManagerObserver>

@end
