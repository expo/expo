/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "ABI11_0_0RCTBridgeModule.h"
#import "ABI11_0_0RCTValueAnimatedNode.h"
#import "ABI11_0_0RCTEventEmitter.h"
#import "ABI11_0_0RCTEventDispatcher.h"

@interface ABI11_0_0RCTNativeAnimatedModule : ABI11_0_0RCTEventEmitter <ABI11_0_0RCTBridgeModule, ABI11_0_0RCTValueAnimatedNodeObserver, ABI11_0_0RCTEventDispatcherObserver>

@end
